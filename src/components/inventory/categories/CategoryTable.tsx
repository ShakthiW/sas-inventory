"use client";

import React from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type {
  CategoryListItem,
  CategorySortField,
  SubCategoryListItem,
} from "@/lib/types";
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
import AddCategoryDialog from "./AddCategoryDialog";
import ActiveStatusBadge from "@/components/ActiveStatusBadge";

type CategoryRow = CategoryListItem;

type ApiResponse = {
  data: Array<{
    id?: string;
    _id?: string;
    name: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
  }>;
};

type SubCategoryResponse = {
  data: Array<{
    id?: string;
    _id?: string;
    name: string;
    slug?: string;
    description?: string;
    parentCategoryId: string;
  }>;
};

export default function CategoryTable() {
  const [q, setQ] = React.useState("");
  const [dir, setDir] = React.useState<"asc" | "desc">("asc");
  const [sort, setSort] = React.useState<CategorySortField>("name");
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [loading, setLoading] = React.useState(false);
  const [allRows, setAllRows] = React.useState<CategoryRow[]>([]);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [subCategories, setSubCategories] = React.useState<
    SubCategoryListItem[]
  >([]);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort: "name",
        dir: "asc",
        page: "1",
        limit: "200",
      });
      const res = await fetch(`/api/inventory/categories?${params.toString()}`);
      const json: ApiResponse = await res.json();
      const mapped: CategoryRow[] = (json.data || []).map((d) => ({
        id: (d.id || d._id || "") as string,
        name: d.name,
        slug: d.slug,
        description: d.description,
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

  const fetchSubCategories = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({
        sort: "name",
        dir: "asc",
        page: "1",
        limit: "500",
      });
      const res = await fetch(
        `/api/inventory/categories/subcategories?${params.toString()}`
      );
      const json: SubCategoryResponse = await res.json();
      const mapped: SubCategoryListItem[] = (json.data || []).map((d) => ({
        id: (d.id || d._id || "") as string,
        name: d.name,
        slug: d.slug,
        description: d.description,
        parentCategoryId: d.parentCategoryId,
      }));
      setSubCategories(mapped);
    } catch {
      setSubCategories([]);
    }
  }, []);

  React.useEffect(() => {
    fetchSubCategories();
  }, [fetchSubCategories]);

  const handleDelete = React.useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        const res = await fetch(`/api/inventory/categories/${id}`, {
          method: "DELETE",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const message =
            data?.error ?? "Failed to delete the category. Please try again.";
          throw new Error(message);
        }

        const removedSubCategoryIds = Array.isArray(
          data?.removedSubCategoryIds
        )
          ? (data.removedSubCategoryIds as string[])
          : [];
        const removedSet = new Set([id, ...removedSubCategoryIds]);

        setAllRows((prev) => {
          const next = prev.filter((row) => row.id !== id);
          setPage((currentPage) => {
            if (
              currentPage > 1 &&
              (currentPage - 1) * limit >= next.length
            ) {
              return Math.max(currentPage - 1, 1);
            }
            return currentPage;
          });
          return next;
        });

        setSubCategories((prev) =>
          prev.filter(
            (sub) =>
              sub.parentCategoryId !== id && !removedSet.has(sub.id)
          )
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to delete the category. Please try again.";
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

  const columns = React.useMemo<ColumnDef<CategoryRow>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Slug", accessorKey: "slug" },
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
        cell: ({ row }) => {
          const v = row.getValue<string>("createdAt");
          return <div>{v ? new Date(v).toLocaleDateString() : "-"}</div>;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const category = row.original;
          const categoryId = category.id;
          if (!categoryId) {
            return null;
          }
          const isDeleting = deletingId === categoryId;
          const dependentSubCategories =
            subCategories.length > 0
              ? subCategories.filter(
                  (sub) => sub.parentCategoryId === categoryId
                )
              : [];
          const dependentCount = dependentSubCategories.length;
          let description: string;
          if (category.name) {
            description =
              dependentCount > 0
                ? `Deleting ${category.name} will also delete ${dependentCount} subcategor${dependentCount === 1 ? "y" : "ies"}. This action cannot be undone.`
                : `Are you sure you want to delete ${category.name}? This action cannot be undone.`;
          } else {
            description =
              dependentCount > 0
                ? `Deleting this category will also delete ${dependentCount} subcategor${dependentCount === 1 ? "y" : "ies"}. This action cannot be undone.`
                : "Are you sure you want to delete this category? This action cannot be undone.";
          }

          return (
            <ConfirmDialog
              title="Delete category?"
              description={description}
              confirmLabel="Delete"
              loadingLabel="Deleting…"
              icon={<Trash2Icon className="size-5" aria-hidden="true" />}
              body={
                dependentCount > 0 ? (
                  <div className="space-y-3">
                    <div className="font-medium text-foreground">
                      Subcategories to be deleted
                    </div>
                    <ul className="space-y-2 text-muted-foreground">
                      {dependentSubCategories.map((sub) => (
                        <li
                          key={sub.id}
                          className="flex flex-col gap-0.5 rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                        >
                          <div className="font-medium text-foreground">
                            {sub.name}
                          </div>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground/80">
                            {sub.slug ? `Slug: ${sub.slug}` : "No slug defined"}
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
                >
                  {isDeleting ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <Trash2Icon className="size-4" />
                  )}
                  <span className="sr-only">Delete category</span>
                </Button>
              }
              onConfirm={() => handleDelete(categoryId)}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 56,
      },
    ],
    [deletingId, handleDelete, subCategories]
  );

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    let base = allRows;
    if (term) {
      base = base.filter((r) =>
        `${r.name} ${r.slug ?? ""}`.toLowerCase().includes(term)
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
              placeholder="Search name, slug…"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as CategorySortField)}
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
          <AddCategoryDialog
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
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
