"use client";

import React from "react";
import type { StockLineItem } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type { StockLineItem };

export type LineItemFormProps = {
  product: { id: string; name: string; sku?: string } | null;
  warehouse: "warehouse-1" | "warehouse-2";
  onAdd(item: StockLineItem): void;
};

export default function LineItemForm({ product, warehouse, onAdd }: LineItemFormProps) {
  const [quantity, setQuantity] = React.useState<number>(1);
  const [unitPrice, setUnitPrice] = React.useState<number | undefined>(
    undefined
  );

  const canAdd = !!product && quantity > 0;

  const handleAdd = () => {
    if (!product) return;
    onAdd({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unit: "Piece",
      quantity,
      unitPrice,
      warehouse,
    });
    setQuantity(1);
    setUnitPrice(undefined);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="text-xs text-muted-foreground mb-1">Product</div>
          <Input
            readOnly
            value={
              product
                ? `${product.name}${product.sku ? ` (${product.sku})` : ""}`
                : "Select a product"
            }
          />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Quantity (Pieces)</div>
          <Input
            type="number"
            min={0}
            value={Number.isFinite(quantity) ? quantity : 0}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Unit Price</div>
          <Input
            type="number"
            min={0}
            value={unitPrice ?? ""}
            onChange={(e) =>
              setUnitPrice(
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button disabled={!canAdd} onClick={handleAdd}>
          Add to list
        </Button>
      </div>
    </div>
  );
}
