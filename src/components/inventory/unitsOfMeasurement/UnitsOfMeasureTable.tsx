"use client";

import React from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import ConfirmDialog from "@/components/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddUnitsOfMeasureDialog from "./AddUnitsOfMeasureDialog";
import ActiveStatusBadge from "@/components/ActiveStatusBadge";
import UnitDetailSheet from "./UnitDetailSheet";
import type { UnitListItem } from "@/lib/types";

type Row = UnitListItem & {
  baseUnitId?: string;
};

type ApiResponse = {
  data: Array<{
    id?: string;
    _id?: string;
    name: string;
    shortName?: string;
    kind: string;
    isActive?: boolean;
    baseUnitId?: string;
    baseUnitName?: string;
    unitsPerPack?: number;
    createdAt?: string;
  }>;
};

export default function UnitsOfMeasureTable() {
  const [q, setQ] = React.useState("");
  const [dir, setDir] = React.useState<"asc" | "desc">("asc");
  const [sort, setSort] = React.useState<"createdAt" | "name">("name");
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [loading, setLoading] = React.useState(false);
  const [allRows, setAllRows] = React.useState<Row[]>([]);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort: "name",
        dir: "asc",
        page: "1",
        limit: "200",
      });
      const res = await fetch(`/api/inventory/units?${params.toString()}`);
      const json: ApiResponse = await res.json();
      const mapped: Row[] = (json.data || []).map((d) => ({
        id: (d.id || d._id || "") as string,
        name: d.name,
        shortName: d.shortName,
        kind: (d.kind === "pack" ? "pack" : "base") as Row["kind"],
        isActive: d.isActive,
        baseUnitId: d.baseUnitId,
        baseUnitName: d.baseUnitName,
        unitsPerPack: d.unitsPerPack,
        createdAt: d.createdAt,
      }));
      setAllRows(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = React.useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        const res = await fetch(`/api/inventory/units/${id}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const message =
            data?.error ?? "Failed to delete the unit. Please try again.";
          throw new Error(message);
        }

        const removedPackUnitIds = Array.isArray(data?.removedPackUnitIds)
          ? (data.removedPackUnitIds as string[])
          : [];
        const removedIds = new Set([id, ...removedPackUnitIds]);

        setAllRows((prev) => {
          const next = prev.filter((row) => !removedIds.has(row.id));
          setPage((currentPage) => {
            if (currentPage > 1 && (currentPage - 1) * limit >= next.length) {
              return Math.max(currentPage - 1, 1);
            }
            return currentPage;
          });
          return next;
        });
        setSelectedId((current) => {
          if (current && removedIds.has(current)) {
            setDetailOpen(false);
            return null;
          }
          return current;
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to delete the unit. Please try again.";
        console.error(message);
        if (typeof window !== "undefined") {
          window.alert(message);
        }
        throw error instanceof Error ? error : new Error(message);
      } finally {
        setDeletingId((current) => (current === id ? null : current));
      }
    },
    [limit]
  );

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Short", accessorKey: "shortName" },
      {
        header: "Type",
        accessorKey: "kind",
        cell: ({ row }) => (
          <div className="capitalize">{row.original.kind}</div>
        ),
      },
      { header: "Base Unit", accessorKey: "baseUnitName" },
      {
        header: "Per Pack",
        accessorKey: "unitsPerPack",
        cell: ({ row }) => {
          if (row.original.kind !== "pack") {
            return <div>—</div>;
          }
          const value = row.original.unitsPerPack;
          return <div>{typeof value === "number" ? value : "-"}</div>;
        },
      },
      {
        header: "Active",
        accessorKey: "isActive",
        cell: ({ row }) => (
          <ActiveStatusBadge active={!!row.original.isActive} />
        ),
      },
      {
        header: "Added",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <div>
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : "-"}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const unit = row.original;
          const unitId = unit.id;
          if (!unitId) {
            return null;
          }
          const isDeleting = deletingId === unitId;
          const dependentPacks =
            unit.kind === "base"
              ? allRows.filter((candidate) => candidate.baseUnitId === unitId)
              : [];
          const dependentPackCount = dependentPacks.length;
          let description: string;
          if (unit.kind === "base") {
            const label = unit.name || "this base unit";
            description =
              dependentPackCount > 0
                ? `Deleting ${label} will also delete the pack units listed below. This action cannot be undone.`
                : `Deleting ${label} will also delete any associated pack units. This action cannot be undone.`;
          } else {
            description = unit.name
              ? `Are you sure you want to delete ${unit.name}? This action cannot be undone.`
              : "Are you sure you want to delete this unit? This action cannot be undone.";
          }

          return (
            <ConfirmDialog
              title="Delete unit?"
              description={description}
              confirmLabel="Delete"
              loadingLabel="Deleting…"
              icon={<Trash2Icon className="size-5" aria-hidden="true" />}
              body={
                unit.kind === "base" && dependentPackCount > 0 ? (
                  <div className="space-y-3">
                    <div className="font-medium text-foreground">
                      Pack units to be deleted
                    </div>
                    <ul className="space-y-2 text-muted-foreground">
                      {dependentPacks.map((pack) => (
                        <li
                          key={pack.id}
                          className="flex flex-col gap-0.5 rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                        >
                          <div className="font-medium text-foreground">
                            {pack.name}
                          </div>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground/80">
                            {[
                              pack.shortName
                                ? `Short: ${pack.shortName}`
                                : null,
                              typeof pack.unitsPerPack === "number"
                                ? `${pack.unitsPerPack} per pack`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" • ") || "Pack details unavailable"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : undefined
              }
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive focus-visible:ring-destructive"
                  disabled={isDeleting}
                  onClick={(event) => event.stopPropagation()}
                >
                  {isDeleting ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <Trash2Icon className="size-4" />
                  )}
                  <span className="sr-only">Delete unit</span>
                </Button>
              }
              onConfirm={() => handleDelete(unitId)}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 56,
      },
    ],
    [allRows, deletingId, handleDelete]
  );

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    let base = allRows;
    if (term) {
      base = base.filter((r) =>
        `${r.name} ${r.shortName ?? ""}`.toLowerCase().includes(term)
      );
    }
    base = [...base].sort((a, b) => {
      const av = sort === "name" ? a.name : a.createdAt ?? "";
      const bv = sort === "name" ? b.name : b.createdAt ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return dir === "asc" ? cmp : -cmp;
    });
    return base;
  }, [allRows, q, sort, dir]);

  const total = filtered.length;
  const pages = Math.max(Math.ceil(total / limit), 1);
  const start = (page - 1) * limit;
  const rows = React.useMemo(
    () => filtered.slice(start, start + limit),
    [filtered, start, limit]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <div className="flex flex-wrap items-center gap-3 px-2 py-4">
          <div className="min-w-56 flex-1">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, short name…"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as "createdAt" | "name")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={dir}
            onValueChange={(v) => setDir(v as "asc" | "desc")}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Dir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={String(limit)}
            onValueChange={(v) => setLimit(Number(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto" />
          <AddUnitsOfMeasureDialog
            onCreated={() => {
              setPage(1);
              fetchAll();
            }}
          />
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative h-10 border-t select-none"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const rowId = row.original.id;
                return (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    data-state={
                      rowId && rowId === selectedId ? "selected" : undefined
                    }
                    onClick={() => {
                      if (!rowId) return;
                      setSelectedId(rowId);
                      setDetailOpen(true);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total
            ? `Showing page ${page} of ${pages} (${total} items)`
            : "\u00A0"}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <UnitDetailSheet
        unitId={selectedId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setSelectedId(null);
          }
        }}
        onUpdated={() => {
          fetchAll();
        }}
      />
    </div>
  );
}
