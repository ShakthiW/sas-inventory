"use client";

import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type ProductRow = {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  brand?: string;
  price?: number;
  createdAt?: string;
  image?: string;
  quantity?: number;
  qtyAlert?: number;
};

type ApiResponse = {
  data: Array<{
    id?: string;
    _id?: string;
    name: string;
    sku?: string;
    category?: string;
    brand?: string;
    pricing?: { price?: number; quantity?: number; qtyAlert?: number };
    createdAt?: string;
    images?: string[];
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

const columns: ColumnDef<ProductRow>[] = [
  {
    header: "Product",
    accessorKey: "name",
    cell: ({ row }) => {
      const { image, name } = row.original as ProductRow;
      const fallback = name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            {image ? (
              <AvatarImage src={image} alt={name} />
            ) : (
              <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
            )}
          </Avatar>
          <div className="font-medium">{name}</div>
        </div>
      );
    },
  },
  { header: "SKU", accessorKey: "sku" },
  { header: "Category", accessorKey: "category" },
  { header: "Brand", accessorKey: "brand" },
  {
    header: "Stock",
    accessorKey: "quantity",
    cell: ({ row }) => {
      const quantity = row.original.quantity ?? 0;
      const alert = row.original.qtyAlert ?? undefined;
      let colorClass = "";
      if (alert && alert > 0) {
        const ratio = quantity / alert;
        if (quantity <= 0) colorClass = "text-destructive bg-destructive/10";
        else if (ratio <= 1) colorClass = "text-destructive bg-destructive/10";
        else if (ratio <= 1.5)
          colorClass =
            "text-amber-600 bg-amber-600/10 dark:text-amber-400 dark:bg-amber-400/10";
        else
          colorClass =
            "text-green-600 bg-green-600/10 dark:text-green-400 dark:bg-green-400/10";
      } else {
        colorClass = "text-muted-foreground bg-muted/30";
      }
      return <Badge className={`border-none ${colorClass}`}>{quantity}</Badge>;
    },
  },
  {
    header: "Price",
    accessorKey: "price",
    cell: ({ row }) => {
      const value = row.getValue<number>("price");
      return <div>{value ?? "-"}</div>;
    },
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

export default function ProductTable() {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<"createdAt" | "name" | "price">(
    "createdAt"
  );
  const [dir, setDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<ProductRow[]>([]);
  const [meta, setMeta] = React.useState<ApiResponse["meta"] | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      // Server-side pagination and search/sort
      const params = new URLSearchParams({
        q,
        sort,
        dir,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/inventory/products?${params.toString()}`);
      const json: ApiResponse = await res.json();
      const mapped: ProductRow[] = (json.data || []).map((d) => ({
        id: (d.id || d._id || "") as string,
        name: d.name,
        sku: d.sku,
        category: d.category,
        brand: d.brand,
        price: d?.pricing?.price,
        createdAt: d.createdAt,
        image:
          Array.isArray(d.images) && d.images.length > 0
            ? d.images[0]
            : undefined,
        quantity: d?.pricing?.quantity,
        qtyAlert: d?.pricing?.qtyAlert,
      }));
      setRows(mapped);
      setMeta(json.meta);
    } finally {
      setLoading(false);
    }
  }, [q, sort, dir, page, limit]);

  // Debounced fetch when q/sort/dir/limit change
  React.useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 300);
    return () => clearTimeout(t);
  }, [q, sort, dir, limit, fetchData]);

  // Fetch when page changes
  React.useEffect(() => {
    fetchData();
  }, [page, fetchData]);

  const total = meta?.total ?? 0;
  const pages = meta?.pages ?? 1;

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
              placeholder="Search name, sku, brand…"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as "createdAt" | "name" | "price")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
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
