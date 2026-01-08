"use client";
import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import DownloadOptionsDialog from "@/components/stock/DownloadOptionsDialog";

type BatchListItem = {
  id: string;
  type: string;
  batchName?: string;
  itemsCount: number;
  productTypesCount?: number;
  labelSize?: string;
  createdAt: string | null;
};

export default function Page() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [batches, setBatches] = React.useState<BatchListItem[]>([]);
  const [downloadDialogBatch, setDownloadDialogBatch] = React.useState<BatchListItem | null>(null);

  const page = Math.max(parseInt(params.get("page") || "1", 10), 1);
  const limit = Math.max(parseInt(params.get("limit") || "20", 10), 1);
  const sort = params.get("sort") || "desc";

  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/stocks?page=${page}&limit=${limit}&sort=${sort}`);
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
  }, [page, limit, sort]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Print Barcodes</h1>
        <p className="text-muted-foreground">
          Generate and print QR codes and barcodes for your inventory batches
        </p>
      </div>
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
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select
            value={sort}
            onValueChange={(value) => {
              const newParams = new URLSearchParams(params.toString());
              newParams.set("sort", value);
              newParams.set("page", "1"); // Reset to first page when sorting changes
              router.push(`${pathname}?${newParams.toString()}`);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest</SelectItem>
              <SelectItem value="asc">Oldest</SelectItem>
            </SelectContent>
          </Select>
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
                  {b.productTypesCount !== undefined && (
                    <>
                      {" · "}
                      <span className="font-medium">
                        {b.productTypesCount}
                      </span>{" "}
                      product type
                      {b.productTypesCount !== 1 ? "s" : ""}
                    </>
                  )}
                  {b.labelSize && (
                    <>
                      {" · "}
                      <span className="text-sm text-muted-foreground">
                        {b.labelSize}
                      </span>
                    </>
                  )}
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
                      setDownloadDialogBatch(b);
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

      <DownloadOptionsDialog
        open={!!downloadDialogBatch}
        onOpenChange={(open) => !open && setDownloadDialogBatch(null)}
        onConfirm={() => {
          if (!downloadDialogBatch) return;
          const url = `/api/stocks/batches/export?batchId=${encodeURIComponent(
            downloadDialogBatch.id
          )}`;
          const a = document.createElement("a");
          a.href = url;
          a.download = `batch_${downloadDialogBatch.id}.txt`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }}
      />
    </div>
  );
}
