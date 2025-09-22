"use client";

import React from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ListResponse, ProductListItem } from "@/lib/types";

type ApiResponse = ListResponse<ProductListItem>;

export type ProductSearchProps = {
  onSelect(product: ProductListItem): void;
};

export default function ProductSearch({ onSelect }: ProductSearchProps) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(8);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<ProductListItem[]>([]);
  const [meta, setMeta] = React.useState<{
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const controllerRef = React.useRef<AbortController | null>(null);
  const cacheRef = React.useRef(
    new Map<
      string,
      { rows: ProductListItem[]; meta: NonNullable<typeof meta> }
    >()
  );

  const fetchProducts = React.useCallback(async () => {
    const key = `${query}||${page}||${limit}`;
    const cached = cacheRef.current.get(key);
    if (cached) {
      startTransition(() => {
        setRows(cached.rows);
        setMeta(cached.meta);
      });
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        page: String(page),
        limit: String(limit),
        sort: "name",
        dir: "asc",
      });
      const res = await fetch(`/api/inventory/products?${params.toString()}`, {
        signal: controller.signal,
      });
      const json: ApiResponse & {
        meta?: {
          total: number;
          page: number;
          limit: number;
          pages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      } = await res.json();
      const mapped: ProductListItem[] = (json.data || []).map((d) => ({
        ...d,
        id: (d.id || d._id || "") as string,
        _id: undefined,
      }));
      const nextMeta = json.meta || {
        total: mapped.length,
        page,
        limit,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      };
      startTransition(() => {
        setRows(mapped);
        setMeta(nextMeta);
      });
      cacheRef.current.set(key, { rows: mapped, meta: nextMeta });
    } catch (err) {
      // Ignore abort errors from cancelled in-flight requests
      if (err instanceof DOMException && err.name === "AbortError") {
        // no-op
      } else {
        // swallow other errors for now
      }
    } finally {
      setLoading(false);
    }
  }, [query, page, limit]);

  // Reset to first page when query changes
  React.useEffect(() => {
    setPage(1);
  }, [query]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      void fetchProducts();
    }, 250);
    return () => clearTimeout(t);
  }, [query, page, fetchProducts]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search product name, sku…"
          className="h-11"
        />
        <Button
          onClick={fetchProducts}
          variant="outline"
          className="h-11"
          disabled={loading || isPending}
        >
          Search
        </Button>
      </div>

      <div className="mt-3 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => {
                const fallback = row.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          {row.images?.[0] ? (
                            <AvatarImage src={row.images[0]} alt={row.name} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {fallback}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="font-medium">{row.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{row.sku || "-"}</TableCell>
                    <TableCell>{row.category || "-"}</TableCell>
                    <TableCell>{row.brand || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => onSelect(row)}>
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-2 flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          {meta
            ? `Page ${meta.page} of ${meta.pages} · ${meta.total} results`
            : rows.length > 0
            ? `Showing ${rows.length} results`
            : ""}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || isPending || !meta?.hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || isPending || !meta?.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
