"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Separator } from "@/components/ui/separator";
import type { StockLineItem } from "@/lib/types";

export type AddedItem = StockLineItem;

export type AddedItemsSheetProps = {
  items: AddedItem[];
  onRemove(index: number): void;
  onCommit(): Promise<void> | void;
};

export default function AddedItemsSheet({
  items,
  onRemove,
  onCommit,
}: AddedItemsSheetProps) {
  const [open, setOpen] = React.useState(false);

  const subtotal = items.reduce(
    (sum, it) => sum + (it.unitPrice || 0) * it.quantity,
    0
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary">Review Items ({items.length})</Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex">
        <SheetHeader>
          <SheetTitle>Items to be added</SheetTitle>
          <SheetDescription>
            Verify and confirm to add these items to stock.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground mt-6">
              No items added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={`${it.productId}-${idx}`}
                  className="rounded-md border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.sku ? `SKU: ${it.sku} · ` : ""}
                        {it.unit ? `Unit: ${it.unit} · ` : ""}
                        Qty: {it.quantity}
                        {typeof it.unitPrice === "number"
                          ? ` · Price: ${it.unitPrice}`
                          : ""}
                        {it.batch ? ` · Batch: ${it.batch}` : ""}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <SheetFooter>
          <div className="w-full">
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Estimated total
              </div>
              <div className="font-semibold">{subtotal}</div>
            </div>
            <Button
              className="w-full mt-3"
              disabled={items.length === 0}
              onClick={async () => {
                await onCommit();
                setOpen(false);
              }}
            >
              Confirm and Add to Stock
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
