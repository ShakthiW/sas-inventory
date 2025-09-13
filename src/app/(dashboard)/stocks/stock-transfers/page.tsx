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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type BatchListItem = {
  id: string;
  type: "in" | "out";
  itemsCount: number;
  createdAt: string | null;
};

type BatchDetail = {
  batchId: string;
  type: "in" | "out";
  createdAt: string | null;
  items: Array<{
    productId: string;
    name: string;
    sku?: string;
    unit?: string;
    quantity: number;
    unitPrice?: number;
    batch?: string;
  }>;
};

export default function Page() {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<BatchListItem[]>([]);
  const [meta, setMeta] = React.useState<{
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<BatchDetail | null>(null);

  const fetchBatches = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/stocks?${params.toString()}`);
      const json: { data: BatchListItem[]; meta: NonNullable<typeof meta> } =
        await res.json();
      setRows(json.data || []);
      setMeta(json.meta || null);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const fetchDetail = React.useCallback(async (batchId: string) => {
    const params = new URLSearchParams({ batchId });
    const res = await fetch(`/api/stocks?${params.toString()}`);
    const json: BatchDetail = await res.json();
    setDetail(json);
  }, []);

  React.useEffect(() => {
    void fetchBatches();
  }, [fetchBatches]);

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4 p-4 h-[calc(100vh-4rem)]">
      <div className="grid gap-4 md:grid-cols-3 h-full min-h-0">
        {/* Left: Filters/Search */}
        <div className="space-y-3">
          <div className="rounded-xl border p-4">
            <div className="text-sm font-medium mb-2">Search Batches</div>
            <div className="flex items-center gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by type or id…"
                className="h-11"
              />
              <Button
                className="h-11"
                variant="outline"
                onClick={() => {
                  setPage(1);
                  void fetchBatches();
                }}
              >
                Search
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Tip: Type &quot;in&quot; or &quot;out&quot; to filter by type.
            </div>
          </div>
        </div>

        {/* Right: Batches Table */}
        <div className="md:col-span-2 rounded-xl border p-4 flex min-h-0 flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Stock Transfers</div>
            <div className="text-sm text-muted-foreground">
              {meta
                ? `Page ${meta.page} of ${meta.pages} · ${meta.total} results`
                : rows.length > 0
                ? `Showing ${rows.length} results`
                : ""}
            </div>
          </div>
          <div className="rounded-md border flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Created</TableHead>
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
                  rows
                    .filter((r) => {
                      const q = query.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        r.id.toLowerCase().includes(q) ||
                        r.type.toLowerCase().includes(q)
                      );
                    })
                    .map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">
                          {row.id}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              row.type === "in"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {row.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {row.itemsCount}
                        </TableCell>
                        <TableCell>
                          {row.createdAt
                            ? new Date(row.createdAt).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={async () => {
                              setOpen(true);
                              setDetail(null);
                              await fetchDetail(row.id);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center">
                      No batches found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta?.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta?.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[96vw] sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Batch Details</SheetTitle>
            <SheetDescription>
              Inspect items included in this stock transfer.
            </SheetDescription>
          </SheetHeader>
          {!detail ? (
            <div className="text-sm text-muted-foreground mt-4">Loading…</div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="text-xs text-muted-foreground">
                Batch: <span className="font-mono">{detail.batchId}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Type: {detail.type.toUpperCase()}
              </div>
              <div className="text-xs text-muted-foreground">
                Created:{" "}
                {detail.createdAt
                  ? new Date(detail.createdAt).toLocaleString()
                  : "-"}
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-20 text-center">
                          No items.
                        </TableCell>
                      </TableRow>
                    ) : (
                      detail.items.map((it, idx) => (
                        <TableRow key={`${it.productId}-${idx}`}>
                          <TableCell className="font-medium">
                            {it.name}
                          </TableCell>
                          <TableCell>{it.sku || "-"}</TableCell>
                          <TableCell className="text-right">
                            {it.quantity}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
