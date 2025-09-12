"use client";

import React from "react";
import ProductBrowser from "@/components/stock/addStock/ProductBrowser";
import type { StockLineItem } from "@/lib/types";
import AddedItemsSheet from "@/components/stock/addStock/AddedItemsSheet";
import AddToStockDialog from "@/components/stock/addStock/AddToStockDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<{
    id: string;
    name: string;
    sku?: string;
    price?: number;
  } | null>(null);
  const [items, setItems] = React.useState<StockLineItem[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const addItem = (item: StockLineItem) => {
    setItems((prev) => [...prev, item]);
    toast.success("Item added to list");
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const commit = async () => {
    try {
      const committedItems = items; // snapshot for QR labels
      const res = await fetch("/api/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Failed to add stock");
      const data = (await res.json()) as { batchId?: string };
      toast.success("Stock updated successfully");
      // Navigate to QR labels using server batchId when available, else fallback to payload
      if (data?.batchId) {
        router.push(`/stocks/qr-labels?batchId=${data.batchId}`);
      } else {
        const payload = encodeURIComponent(JSON.stringify(committedItems));
        router.push(`/stocks/qr-labels?payload=${payload}`);
      }
      setItems([]);
      setSelected(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 min-w-0 rounded-xl border p-4 flex flex-col">
          <div className="mb-2 text-sm font-medium">Browse Products</div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ProductBrowser
              onSelect={(p) => {
                setSelected({
                  id: p.id,
                  name: p.name,
                  sku: p.sku,
                  price: p.price,
                });
                setDialogOpen(true);
              }}
            />
          </div>
        </div>

        <div className="w-[340px] flex-none rounded-xl border p-4 flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Current Items</div>
            <div className="text-xs text-muted-foreground">
              {items.length} item{items.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground">No items yet.</div>
            ) : (
              <div className="grid gap-2">
                {items.map((it, idx) => (
                  <div
                    key={`${it.productId}-${idx}`}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <div className="font-medium line-clamp-1">{it.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.unit ? `Unit: ${it.unit} · ` : ""}
                        Qty: {it.quantity}
                        {typeof it.unitPrice === "number"
                          ? ` · Price: ${it.unitPrice}`
                          : ""}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <AddedItemsSheet
              items={items}
              onRemove={removeItem}
              onCommit={commit}
            />
          </div>
        </div>
      </div>

      <AddToStockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selected}
        onConfirm={addItem}
      />
    </div>
  );
}
