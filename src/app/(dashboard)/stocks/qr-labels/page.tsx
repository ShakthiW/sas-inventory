"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import type { StockLineItem } from "@/lib/types";
// print functionality removed per requirement

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
  const [batchName, setBatchName] = React.useState<string>("");
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
            const data = (await res.json()) as {
              items?: StockLineItem[];
              batchName?: string;
            };
            if (!ignore) {
              if (Array.isArray(data.items)) setItems(data.items);
              if (data.batchName) setBatchName(data.batchName);
            }
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

  // printing behavior removed

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
      {/* Batch name header */}
      {batchName && (
        <div className="mb-4 rounded-lg border bg-muted/50 p-4">
          <div className="text-sm font-medium text-muted-foreground">Batch</div>
          <div className="text-xl font-semibold">{batchName}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {labels.length} QR code{labels.length !== 1 ? "s" : ""} to print
          </div>
        </div>
      )}

      {/* Print styles for 2×1 inch roll labels */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  @page { size: 2in 1in; margin: 0; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print-hidden { display: none !important; }
}
.qr-2x1 { width: 2in; height: 1in; page-break-after: always; break-inside: avoid; background: white; overflow: hidden; }
.qr-2x1-inner { display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 0.06in; padding: 0.06in; box-sizing: border-box; width: 100%; height: 100%; }
.qr-2x1-code { width: 0.9in; height: 0.9in; flex-shrink: 0; }
.qr-2x1-content { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.qr-2x1-name { font-size: 8pt; font-weight: 700; line-height: 1.1; margin-bottom: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.qr-2x1-meta { font-size: 7pt; line-height: 1.1; opacity: 0.75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          `,
        }}
      />
      
      <div className="flex items-center justify-between gap-3 print:hidden mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QR Labels</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading
              ? "Loading..."
              : `${labels.length} label${labels.length === 1 ? "" : "s"} prepared for printing`}
          </p>
        </div>
      </div>

      {/* Screen preview grid */}
      <div className="space-y-8 print:hidden">
        {Object.entries(
          labels.reduce((acc, label) => {
            const key = label.item.name;
            if (!acc[key]) acc[key] = [];
            acc[key].push(label);
            return acc;
          }, {} as Record<string, typeof labels>)
        ).map(([productName, productLabels]) => (
          <div key={productName} className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="border-b bg-muted/40 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{productName}</h3>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                  {productLabels.length} labels
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productLabels.map(({ key, item }) => (
                  <div key={key} className="flex flex-col items-center group">
                    {/* The Label Preview Card */}
                    <div className="relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                      {/* This container mimics the print size but scaled up/down for display if needed, 
                          or just displayed as is. 2in = 192px at 96dpi. 
                          Let's render it at 1:1 scale or slightly larger for visibility. */}
                      <div className="w-[2in] h-[1in] relative">
                         <div className="qr-2x1">
                          <div className="qr-2x1-inner">
                            <QRCodeSVG
                              value={buildQrValue(item)}
                              size={256}
                              level="M"
                              includeMargin={false}
                              className="qr-2x1-code"
                            />
                            <div className="qr-2x1-content">
                              <div className="qr-2x1-name">{item.name}</div>
                              <div className="qr-2x1-meta">
                                {item.sku
                                  ? `SKU: ${item.sku}`
                                  : `ID: ${item.productId.slice(0, 6)}...`}
                              </div>
                              {item.batch && (
                                <div className="qr-2x1-meta">
                                  Batch: {item.batch}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Overlay for actions if needed later */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground text-center font-mono">
                      #{key.split('-').pop()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actual Print Output (Hidden on Screen) */}
      <div className="hidden print:block">
        {labels.map(({ key, item }) => (
          <div key={key} className="qr-2x1">
            <div className="qr-2x1-inner">
              <QRCodeSVG
                value={buildQrValue(item)}
                size={256}
                level="M"
                includeMargin={false}
                className="qr-2x1-code"
              />
              <div className="qr-2x1-content">
                <div className="qr-2x1-name">{item.name}</div>
                <div className="qr-2x1-meta">
                  {item.sku
                    ? `SKU: ${item.sku}`
                    : `ID: ${item.productId.slice(0, 6)}...`}
                </div>
                {item.batch && (
                  <div className="qr-2x1-meta">
                    Batch: {item.batch}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
