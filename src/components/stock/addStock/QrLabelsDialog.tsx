"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { StockLineItem } from "@/lib/types";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

export type QrLabelsDialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  items: StockLineItem[];
};

function buildQrValue(item: StockLineItem): string {
  // Compact, versioned payload. Kept small for scan reliability.
  // "SASINV:1|P:<productId>|U:<unit?>|B:<batch?>|S:<sku?>"
  const parts: string[] = [`SASINV:1`, `P:${item.productId}`];
  if (item.unit) parts.push(`U:${item.unit}`);
  if (item.batch) parts.push(`B:${item.batch}`);
  if (item.sku) parts.push(`S:${item.sku}`);
  return parts.join("|");
}

export default function QrLabelsDialog({
  open,
  onOpenChange,
  items,
}: QrLabelsDialogProps) {
  // Expand items into labels per quantity
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

  const totalLabels = labels.length;

  const handlePrint = React.useCallback(async () => {
    try {
      const mod = await import("print-js");
      const printFn: (opts: unknown) => void =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mod as any)?.default || (mod as unknown as (opts: unknown) => void);
      printFn({ printable: "print-root", type: "html", scanStyles: false });
    } catch {
      window.print();
    }
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 print:hidden" />
        <Dialog.Content className="bg-background text-foreground fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-xl border p-4 shadow-lg outline-none print:static print:translate-x-0 print:translate-y-0 print:w-auto print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
          {/* Print styles for 2×1 inch labels */}
          <style
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
            <Dialog.Title className="text-lg font-semibold">
              QR Labels
            </Dialog.Title>
            <div className="flex items-center gap-2">
              <Link
                href={{
                  pathname: "/stocks/qr-labels",
                  query: { payload: encodeURIComponent(JSON.stringify(items)) },
                }}
                className="inline-flex items-center"
              >
                <Button variant="secondary">Open full page</Button>
              </Link>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handlePrint}>Print</Button>
            </div>
          </div>
          <div className="print:hidden text-xs text-muted-foreground mt-1">
            {totalLabels} label{totalLabels === 1 ? "" : "s"} prepared
          </div>
          <Separator className="my-3 print:hidden" />

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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
