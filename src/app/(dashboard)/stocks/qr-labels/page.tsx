"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import type { StockLineItem } from "@/lib/types";
import { Button } from "@/components/ui/button";

function buildQrValue(item: StockLineItem): string {
  const parts: string[] = ["SASINV:1", `P:${item.productId}`];
  if (item.unit) parts.push(`U:${item.unit}`);
  if (item.batch) parts.push(`B:${item.batch}`);
  if (item.sku) parts.push(`S:${item.sku}`);
  return parts.join("|");
}

export default function Page() {
  const params = useSearchParams();
  const payloadParam = params.get("payload");
  const batchId = params.get("batchId");
  const [items, setItems] = React.useState<StockLineItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (batchId) {
        try {
          setLoading(true);
          const res = await fetch(
            `/api/stocks?batchId=${encodeURIComponent(batchId)}`
          );
          if (res.ok) {
            const data = (await res.json()) as { items?: StockLineItem[] };
            if (!ignore && Array.isArray(data.items)) setItems(data.items);
          }
        } finally {
          setLoading(false);
        }
        return;
      }
      if (!payloadParam) return;
      try {
        const decoded = decodeURIComponent(payloadParam);
        const parsed = JSON.parse(decoded);
        if (!ignore && Array.isArray(parsed)) {
          setItems(parsed as StockLineItem[]);
        }
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [batchId, payloadParam]);

  const labels = React.useMemo(() => {
    const arr: Array<{ key: string; item: StockLineItem; index: number }> = [];
    for (const it of items) {
      const count = Math.max(1, Math.floor(it.quantity || 1));
      for (let i = 0; i < count; i++) {
        arr.push({ key: `${it.productId}-${i}`, item: it, index: i });
      }
    }
    return arr;
  }, [items]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div className="text-lg font-semibold">QR Labels</div>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </div>
      <div className="print:hidden text-xs text-muted-foreground mt-1">
        {loading
          ? "Loading..."
          : `${labels.length} label${labels.length === 1 ? "" : "s"} prepared`}
      </div>
      <div className="my-3 print:hidden border-b" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 print:grid print:grid-cols-4 print:gap-2">
        {labels.map(({ key, item }) => (
          <div
            key={key}
            className="border rounded-md p-2 flex flex-col items-center justify-center gap-2 break-inside-avoid print:border print:rounded-none print:p-1"
          >
            <QRCodeSVG value={buildQrValue(item)} size={112} level="M" />
            <div className="w-full text-center">
              <div className="text-xs font-medium leading-tight line-clamp-2">
                {item.name}
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                {item.sku
                  ? `SKU: ${item.sku}`
                  : `ID: ${item.productId.slice(0, 6)}...`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
