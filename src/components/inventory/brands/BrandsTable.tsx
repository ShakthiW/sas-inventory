"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

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
import AddBrandsDialog from "./AddBrandsDialog";
import Image from "next/image";
import ActiveStatusBadge from "@/components/ActiveStatusBadge";

type BrandRow = {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
  createdAt?: string;
};

type ApiResponse = {
  data: Array<{
    id?: string;
    _id?: string;
    name: string;
    description?: string;
    logoUrl?: string;
    isActive?: boolean;
    createdAt?: string;
  }>;
};

const columns: ColumnDef<BrandRow>[] = [
  { header: "Name", accessorKey: "name" },
  {
    header: "Logo",
    accessorKey: "logoUrl",
    cell: ({ row }) => {
      const url = row.original.logoUrl;
      return url ? (
        <Image
          src={url}
          alt={row.original.name}
          className="h-8 w-8 rounded object-cover"
          width={32}
          height={32}
        />
      ) : (
        <div className="text-xs text-muted-foreground">—</div>
      );
    },
  },
  {
    header: "Active",
    accessorKey: "isActive",
    cell: ({ row }) => <ActiveStatusBadge active={!!row.original.isActive} />,
  },
  {
    header: "Added",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const v = row.getValue<string>("createdAt");
      return <div>{v ? new Date(v).toLocaleDateString() : "-"}</div>;
    },
  },
];

export default function BrandsTable() {
  const [q, setQ] = React.useState("");
  const [dir, setDir] = React.useState<"asc" | "desc">("asc");
  const [sort, setSort] = React.useState<"createdAt" | "name">("name");
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [loading, setLoading] = React.useState(false);
  const [allRows, setAllRows] = React.useState<BrandRow[]>([]);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort: "name",
        dir: "asc",
        page: "1",
        limit: "200",
      });
      const res = await fetch(`/api/inventory/brands?${params.toString()}`);
      const json: ApiResponse = await res.json();
      const mapped: BrandRow[] = (json.data || []).map((d) => ({
        id: (d.id || d._id || "") as string,
        name: d.name,
        description: d.description,
        logoUrl: d.logoUrl,
        isActive: d.isActive,
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

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    let base = allRows;
    if (term) {
      base = base.filter((r) =>
        `${r.name} ${r.description ?? ""}`.toLowerCase().includes(term)
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
              placeholder="Search name, description…"
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
          <AddBrandsDialog
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
    </div>
  );
}
