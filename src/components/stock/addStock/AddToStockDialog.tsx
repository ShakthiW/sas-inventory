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
  product: {
    id: string;
    name: string;
    sku?: string;
    price?: number;
    category?: string;
    subCategory?: string;
    brand?: string;
    unit?: string;
    supplier?: string;
  } | null;
  onConfirm(item: StockLineItem): void;
};

export default function AddToStockDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
}: AddToStockDialogProps) {
  const [quantity, setQuantity] = React.useState<number>(1);
  const [warehouse, setWarehouse] = React.useState<"warehouse-1" | "warehouse-2">("warehouse-1");

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
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Warehouse</div>
              <Select value={warehouse} onValueChange={(v) => setWarehouse(v as "warehouse-1" | "warehouse-2")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse-1">Main Warehouse</SelectItem>
                  <SelectItem value="warehouse-2">Secondary Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Quantity (Pieces)</div>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setQuantity(Number(e.target.value))
                }
              />
            </div>
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
                  unit: "Piece",
                  quantity,
                  unitPrice: product?.price,
                  category: product.category,
                  subCategory: product.subCategory,
                  brand: product.brand,
                  supplier: product.supplier,
                  warehouse: warehouse,
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
