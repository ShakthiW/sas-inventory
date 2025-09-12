"use client";

import React from "react";
import type { ProductListItem } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

type ProductRow = {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  brand?: string;
  price?: number;
  image?: string;
  quantity?: number;
  unit?: string;
};

type ProductsResponse = {
  data: ProductListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

type Category = { id: string; name: string };

export type ProductBrowserProps = {
  onSelect(product: {
    id: string;
    name: string;
    sku?: string;
    price?: number;
  }): void;
  footer?: React.ReactNode;
};

export default function ProductBrowser({
  onSelect,
  footer,
}: ProductBrowserProps) {
  const [q, setQ] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string>("all");
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [sort, setSort] = React.useState<"createdAt" | "name" | "price">(
    "createdAt"
  );
  const [dir, setDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(15);
  const [loading, setLoading] = React.useState(false);
  const [allRows, setAllRows] = React.useState<ProductRow[]>([]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch(
        "/api/inventory/categories?limit=200&sort=name&dir=asc"
      );
      const json = await res.json();
      type CategoryApi = { id?: string; _id?: string; name: string };
      const arr: CategoryApi[] = Array.isArray(json?.data)
        ? (json.data as CategoryApi[])
        : [];
      const data = arr.map((c) => ({
        id: (c.id || c._id) as string,
        name: c.name,
      }));
      setCategories(data);
    };
    fetchCategories();
  }, []);

  // Fetch once (server pagination) and then filter/sort/paginate client-side
  const fetchAllProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort: "name",
        dir: "asc",
        page: "1",
        limit: "200",
      });
      const res = await fetch(`/api/inventory/products?${params.toString()}`);
      const json: ProductsResponse = await res.json();
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
        unit: d?.pricing?.unit || d.unit,
      }));
      setAllRows(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce only page reset; data comes from allRows (no refetch)
  React.useEffect(() => {
    const t = setTimeout(() => setPage(1), 200);
    return () => clearTimeout(t);
  }, [q, categoryId, sort, dir]);

  React.useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  // Derived client-side filtering/sorting/pagination
  const filtered = React.useMemo(() => {
    const search = q.trim().toLowerCase();
    let base = allRows;
    if (categoryId !== "all") {
      const categoryName = categories.find((c) => c.id === categoryId)?.name;
      if (categoryName) {
        base = base.filter(
          (r) => (r.category || "").toLowerCase() === categoryName.toLowerCase()
        );
      }
    }
    if (search) {
      base = base.filter((r) =>
        `${r.name} ${r.sku ?? ""} ${r.category ?? ""} ${r.brand ?? ""}`
          .toLowerCase()
          .includes(search)
      );
    }
    base = [...base].sort((a, b) => {
      let cmp = 0;
      if (sort === "name") cmp = a.name.localeCompare(b.name);
      else if (sort === "price") cmp = (a.price ?? 0) - (b.price ?? 0);
      else cmp = 0; // createdAt not present in mapped rows
      return dir === "asc" ? cmp : -cmp;
    });
    return base;
  }, [allRows, q, categoryId, categories, sort, dir]);

  const total = filtered.length;
  const pages = Math.max(Math.ceil(total / limit), 1);
  const start = (page - 1) * limit;
  const rows = React.useMemo(
    () => filtered.slice(start, start + limit),
    [filtered, start, limit]
  );

  const formatPrice = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "-";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <div className="w-full h-full flex min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-48 flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="h-11"
          />
        </div>
        <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
          <SelectTrigger className="w-48 h-11">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(v: "createdAt" | "name" | "price") => setSort(v)}
        >
          <SelectTrigger className="w-40 h-11">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Added</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="price">Price</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dir} onValueChange={(v: "asc" | "desc") => setDir(v)}>
          <SelectTrigger className="w-28 h-11">
            <SelectValue placeholder="Dir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Asc</SelectItem>
            <SelectItem value="desc">Desc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {loading && allRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : rows.length ? (
            rows.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="h-40 w-full bg-muted/40">
                  <Image
                    src={p.image || "/window.svg"}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    width={160}
                    height={160}
                  />
                </div>
                <CardHeader className="pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <div className="text-base font-semibold whitespace-nowrap">
                      {formatPrice(p.price)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        LKR
                      </span>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-1">
                    {p.unit ? p.unit : "other"} · Stock: {p.quantity ?? 0}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="mt-1 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() =>
                        onSelect({
                          id: p.id,
                          name: p.name,
                          sku: p.sku,
                          price: p.price,
                        })
                      }
                    >
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No results.</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total ? `Page ${page} of ${pages} (${total} items)` : "\u00A0"}
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
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
