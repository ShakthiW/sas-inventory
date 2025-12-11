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

function getQrSizeClass(qrSize?: string): string {
  switch (qrSize) {
    case "100x150":
      return "100x150";
    case "25x25":
      return "25x25";
    case "100x50":
    default:
      return "100x50";
  }
}

function getQrDisplaySize(qrSize?: string): { width: string; height: string } {
  switch (qrSize) {
    case "100x150":
      return { width: "100mm", height: "150mm" };
    case "25x25":
      return { width: "25mm", height: "25mm" };
    case "100x50":
    default:
      return { width: "100mm", height: "50mm" };
  }
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

      {/* Print styles for different QR label sizes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print-hidden { display: none !important; }
}

/* 100x50mm size (default 2×1 inch equivalent) */
.qr-100x50 { width: 100mm; height: 50mm; page-break-after: always; break-inside: avoid; background: white; overflow: hidden; }
.qr-100x50-inner { display: flex; flex-direction: row; align-items: center; justify-content: flex-start; gap: 2mm; padding: 2mm; box-sizing: border-box; width: 100%; height: 100%; }
.qr-100x50-code { width: 46mm; height: 46mm; flex-shrink: 0; }
.qr-100x50-content { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.qr-100x50-name { font-size: 10pt; font-weight: 700; line-height: 1.2; margin-bottom: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.qr-100x50-meta { font-size: 8pt; line-height: 1.1; opacity: 0.75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 100x150mm size (tall label) */
.qr-100x150 { width: 100mm; height: 150mm; page-break-after: always; break-inside: avoid; background: white; overflow: hidden; }
.qr-100x150-inner { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 3mm; padding: 5mm; box-sizing: border-box; width: 100%; height: 100%; }
.qr-100x150-code { width: 80mm; height: 80mm; flex-shrink: 0; }
.qr-100x150-content { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: flex-start; width: 100%; text-align: center; }
.qr-100x150-name { font-size: 12pt; font-weight: 700; line-height: 1.3; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.qr-100x150-meta { font-size: 10pt; line-height: 1.2; opacity: 0.75; margin-bottom: 2px; }

/* 25x25mm size (small square label) */
.qr-25x25 { width: 25mm; height: 25mm; page-break-after: always; break-inside: avoid; background: white; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.qr-25x25-inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 2mm; box-sizing: border-box; }
.qr-25x25-code { width: 23mm; height: 23mm; }

@media print {
  .qr-100x50 { page-break-after: always; }
  .qr-100x150 { page-break-after: always; }
  .qr-25x25 { page-break-after: always; }
}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productLabels.map(({ key, item }) => {
                  const sizeClass = getQrSizeClass(item.qrSize);
                  const displaySize = getQrDisplaySize(item.qrSize);
                  return (
                  <div key={key} className="flex flex-col items-center group">
                    {/* The Label Preview Card */}
                    <div className="relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                      <div style={{ width: displaySize.width, height: displaySize.height }} className="relative">
                         <div className={`qr-${sizeClass}`}>
                          <div className={`qr-${sizeClass}-inner`}>
                            <QRCodeSVG
                              value={buildQrValue(item)}
                              size={256}
                              level="M"
                              includeMargin={false}
                              className={`qr-${sizeClass}-code`}
                            />
                            {sizeClass !== "25x25" && (
                              <div className={`qr-${sizeClass}-content`}>
                                <div className={`qr-${sizeClass}-name`}>{item.name}</div>
                                <div className={`qr-${sizeClass}-meta`}>
                                  {item.sku
                                    ? `SKU: ${item.sku}`
                                    : `ID: ${item.productId.slice(0, 6)}...`}
                                </div>
                                {item.batch && (
                                  <div className={`qr-${sizeClass}-meta`}>
                                    Batch: {item.batch}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Overlay for actions if needed later */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground text-center font-mono">
                      #{key.split('-').pop()} • {item.qrSize || "100x50"}
                    </div>
                  </div>
                );})}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actual Print Output (Hidden on Screen) */}
      <div className="hidden print:block">
        {labels.map(({ key, item }) => {
          const sizeClass = getQrSizeClass(item.qrSize);
          return (
          <div key={key} className={`qr-${sizeClass}`}>
            <div className={`qr-${sizeClass}-inner`}>
              <QRCodeSVG
                value={buildQrValue(item)}
                size={256}
                level="M"
                includeMargin={false}
                className={`qr-${sizeClass}-code`}
              />
              {sizeClass !== "25x25" && (
                <div className={`qr-${sizeClass}-content`}>
                  <div className={`qr-${sizeClass}-name`}>{item.name}</div>
                  <div className={`qr-${sizeClass}-meta`}>
                    {item.sku
                      ? `SKU: ${item.sku}`
                      : `ID: ${item.productId.slice(0, 6)}...`}
                  </div>
                  {item.batch && (
                    <div className={`qr-${sizeClass}-meta`}>
                      Batch: {item.batch}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}
