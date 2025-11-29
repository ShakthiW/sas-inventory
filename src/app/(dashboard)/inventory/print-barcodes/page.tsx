"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type BatchListItem = {
  id: string;
  type: string;
  batchName?: string;
  itemsCount: number;
  createdAt: string | null;
};

export default function Page() {
  const params = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [batches, setBatches] = React.useState<BatchListItem[]>([]);

  const page = Math.max(parseInt(params.get("page") || "1", 10), 1);
  const limit = Math.max(parseInt(params.get("limit") || "20", 10), 1);

  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/stocks?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error("Failed to load batches");
        const json = (await res.json()) as { data: BatchListItem[] };
        if (!ignore) setBatches(json.data || []);
      } catch (e: unknown) {
        if (!ignore)
          setError(e instanceof Error ? e.message : "Unexpected error");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [page, limit]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Batches</div>
      </div>
      <Separator />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {loading
            ? "Loading batches..."
            : `${batches.length} batch${
                batches.length === 1 ? "" : "es"
              } found`}
        </div>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {batches.map((b) => {
          const isStockIn = b.type === "in";
          return (
            <Card key={b.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base truncate">
                  {b.batchName || `Batch #${b.id.slice(0, 8)}`}
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  <span
                    className={
                      isStockIn
                        ? "text-emerald-600 font-medium"
                        : "text-orange-600 font-medium"
                    }
                  >
                    {isStockIn ? "Stock In" : "Stock Out"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium">{b.itemsCount}</span> item
                  {b.itemsCount !== 1 ? "s" : ""}
                </div>
                <div className="text-xs">
                  {b.createdAt
                    ? new Date(b.createdAt).toLocaleString()
                    : "Unknown"}
                </div>
                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.location.href = `/stocks/qr-labels?batchId=${b.id}`;
                    }}
                  >
                    View QR Codes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = `/api/stocks/batches/export?batchId=${encodeURIComponent(
                        b.id
                      )}`;
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `batch_${b.id}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    }}
                  >
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
