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
  batchName?: string;
  itemsCount: number;
  createdAt: string | null;
};

type BatchDetail = {
  batchId: string;
  type: "in" | "out";
  batchName?: string;
  createdAt: string | null;
  items: Array<{
    productId: string;
    name: string;
    sku?: string;
    unit?: string;
    quantity: number;
    unitPrice?: number;
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
            <div className="text-sm font-medium">History</div>
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
                  <TableHead>Batch Name</TableHead>
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
                        <TableCell>
                          <div className="font-medium">
                            {row.batchName || `Batch #${row.id.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {row.id.slice(0, 12)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              row.type === "in"
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {row.type === "in" ? "Stock In" : "Stock Out"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {row.itemsCount}
                        </TableCell>
                        <TableCell className="text-sm">
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
                            View Details
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
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="text-lg font-semibold">
                  {detail.batchName || `Batch #${detail.batchId.slice(0, 8)}`}
                </div>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Type: </span>
                    <span
                      className={
                        detail.type === "in"
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {detail.type === "in" ? "Stock In" : "Stock Out"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Created: </span>
                    {detail.createdAt
                      ? new Date(detail.createdAt).toLocaleString()
                      : "-"}
                  </div>
                  <div>
                    <span className="font-medium">Items: </span>
                    {detail.items.length}
                  </div>
                  <div className="text-xs font-mono pt-1">
                    ID: {detail.batchId}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Items in this batch</div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-20 text-center">
                            No items.
                          </TableCell>
                        </TableRow>
                      ) : (
                        detail.items.map((it, idx) => (
                          <TableRow key={`${it.productId}-${idx}`}>
                            <TableCell className="font-medium">
                              {it.name}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {it.sku || "-"}
                            </TableCell>
                            <TableCell>
                              {it.unit ? (
                                <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted">
                                  {it.unit}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {it.quantity}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
