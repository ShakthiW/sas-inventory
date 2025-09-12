"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StockLineItem } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AddToStockDialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  product: { id: string; name: string; sku?: string; price?: number } | null;
  onConfirm(item: StockLineItem): void;
};

export default function AddToStockDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
}: AddToStockDialogProps) {
  const [units, setUnits] = React.useState<
    { id: string; name: string; shortName?: string }[]
  >([]);
  const [unit, setUnit] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const [batch, setBatch] = React.useState<string>("");
  // unitPrice is derived from product price; no input in dialog

  React.useEffect(() => {
    if (!open) return;
    const fetchUnits = async () => {
      const res = await fetch(
        "/api/inventory/units?limit=200&dir=asc&sort=name"
      );
      const json = await res.json();
      const data = (json?.data || []).map(
        (u: {
          id?: string;
          _id?: string;
          name: string;
          shortName?: string;
        }) => ({
          id: u.id || u._id,
          name: u.name,
          shortName: u.shortName,
        })
      );
      setUnits(data);
    };
    fetchUnits();
  }, [open]);

  React.useEffect(() => {
    // reset when product changes
    setUnit("");
    setQuantity(1);
    setBatch("");
    // nothing for price; derived
  }, [product?.id]);

  const canConfirm = !!product && quantity > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="bg-background text-foreground fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border p-4 shadow-lg outline-none">
          <Dialog.Title className="text-lg font-semibold">
            Add to Stock
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            {product ? product.name : "Select a product"}
          </Dialog.Description>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Unit</div>
              <Select value={unit} onValueChange={(v) => setUnit(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.name}>
                      {u.name} {u.shortName ? `(${u.shortName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Quantity</div>
              <Input
                type="number"
                min={0}
                value={quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setQuantity(Number(e.target.value))
                }
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">
                Batch (optional)
              </div>
              <Input
                type="text"
                value={batch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBatch(e.target.value)
                }
                placeholder="e.g., LOT-2025-04"
              />
            </div>

            {/* Unit price removed; we will use product price */}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button
              disabled={!canConfirm}
              onClick={() => {
                if (!product) return;
                onConfirm({
                  productId: product.id,
                  name: product.name,
                  sku: product.sku,
                  unit: unit || undefined,
                  quantity,
                  unitPrice: product?.price,
                  batch: batch || undefined,
                });
                onOpenChange(false);
              }}
            >
              Add
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
