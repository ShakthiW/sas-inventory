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
  const autoprint = params.get("autoprint") === "1";
  const [items, setItems] = React.useState<StockLineItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  const doPrint = React.useCallback(async () => {
    try {
      const mod = await import("print-js");
      const printFn: (opts: unknown) => void =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mod as any)?.default || (mod as unknown as (opts: unknown) => void);
      // Print only the container to avoid headers/controls
      printFn({ printable: "print-root", type: "html", scanStyles: false });
    } catch {
      window.print();
    }
  }, []);

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

  // Auto print when requested and data is ready
  const printedRef = React.useRef(false);
  React.useEffect(() => {
    if (printedRef.current) return;
    if (!autoprint) return;
    if (loading) return;
    if (items.length === 0) return;
    printedRef.current = true;
    // Slight delay to ensure layout is painted, then print only container
    setTimeout(() => {
      void doPrint();
    }, 200);
  }, [autoprint, loading, items.length, doPrint]);

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
      {/* Print styles for 2×1 inch roll labels */}
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  @page { size: 2in 1in; margin: 0; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
.qr-2x1 { width: 2in; height: 1in; page-break-after: always; break-inside: avoid; }
.qr-2x1-inner { display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 0.06in; padding: 0.06in; box-sizing: border-box; width: 100%; height: 100%; }
.qr-2x1-code { width: 0.9in; height: 0.9in; }
.qr-2x1-name { font-size: 8pt; font-weight: 600; line-height: 1.1; }
.qr-2x1-meta { font-size: 7pt; line-height: 1.1; opacity: 0.75; }
          `,
        }}
      />
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div className="text-lg font-semibold">QR Labels</div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void doPrint()}>Print</Button>
        </div>
      </div>
      <div className="print:hidden text-xs text-muted-foreground mt-1">
        {loading
          ? "Loading..."
          : `${labels.length} label${labels.length === 1 ? "" : "s"} prepared`}
      </div>
      <div className="my-3 print:hidden border-b" />

      {/* Screen preview grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 print:hidden">
        {labels.map(({ key, item }) => (
          <div key={key} className="border rounded-md">
            <div className="qr-2x1">
              <div className="qr-2x1-inner">
                <QRCodeSVG
                  value={buildQrValue(item)}
                  size={256}
                  level="M"
                  includeMargin={false}
                  style={{ width: "0.9in", height: "0.9in" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="qr-2x1-name truncate">{item.name}</div>
                  <div className="qr-2x1-meta truncate">
                    {item.sku
                      ? `SKU: ${item.sku}`
                      : `ID: ${item.productId.slice(0, 6)}...`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Print layout root: exact 2×1 pages, one per label */}
      <div id="print-root" className="hidden print:block">
        {labels.map(({ key, item }) => (
          <div key={key} className="qr-2x1">
            <div className="qr-2x1-inner">
              <QRCodeSVG
                value={buildQrValue(item)}
                size={256}
                level="M"
                includeMargin={false}
                style={{ width: "0.9in", height: "0.9in" }}
              />
              <div className="flex-1 min-w-0">
                <div className="qr-2x1-name truncate">{item.name}</div>
                <div className="qr-2x1-meta truncate">
                  {item.sku
                    ? `SKU: ${item.sku}`
                    : `ID: ${item.productId.slice(0, 6)}...`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
