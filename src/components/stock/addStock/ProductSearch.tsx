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

type ProductRow = {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  brand?: string;
  price?: number;
  image?: string;
  quantity?: number;
};

type ApiResponse = {
  data: Array<{
    id?: string;
    _id?: string;
    name: string;
    sku?: string;
    category?: string;
    brand?: string;
    pricing?: { price?: number; quantity?: number };
    images?: string[];
  }>;
};

export type ProductSearchProps = {
  onSelect(product: ProductRow): void;
};

export default function ProductSearch({ onSelect }: ProductSearchProps) {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<ProductRow[]>([]);

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        page: "1",
        limit: "8",
        sort: "name",
        dir: "asc",
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
        image:
          Array.isArray(d.images) && d.images.length > 0
            ? d.images[0]
            : undefined,
        quantity: d?.pricing?.quantity,
      }));
      setRows(mapped);
    } finally {
      setLoading(false);
    }
  }, [query]);

  React.useEffect(() => {
    const t = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(t);
  }, [query, fetchProducts]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search product name, sku…"
          className="h-11"
        />
        <Button onClick={fetchProducts} variant="outline" className="h-11">
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
                          {row.image ? (
                            <AvatarImage src={row.image} alt={row.name} />
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
    </div>
  );
}
