"use client";

import React from "react";
import type { StockLineItem } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type { StockLineItem };

export type LineItemFormProps = {
  product: { id: string; name: string; sku?: string } | null;
  onAdd(item: StockLineItem): void;
};

export default function LineItemForm({ product, onAdd }: LineItemFormProps) {
  const [quantity, setQuantity] = React.useState<number>(1);
  const [unit, setUnit] = React.useState<string>("");
  const [unitPrice, setUnitPrice] = React.useState<number | undefined>(
    undefined
  );

  const [units, setUnits] = React.useState<
    { id: string; name: string; shortName?: string }[]
  >([]);

  React.useEffect(() => {
    const fetchUnits = async () => {
      const res = await fetch(
        "/api/inventory/units?limit=200&dir=asc&sort=name"
      );
      const json = await res.json();
      type UnitApi = {
        id?: string;
        _id?: string;
        name: string;
        shortName?: string;
      };
      const arr: UnitApi[] = Array.isArray(json?.data)
        ? (json.data as UnitApi[])
        : [];
      const data = arr.map((u) => ({
        id: (u.id || u._id) as string,
        name: u.name,
        shortName: u.shortName,
      }));
      setUnits(data);
    };
    fetchUnits();
  }, []);

  const canAdd = !!product && quantity > 0;

  const handleAdd = () => {
    if (!product) return;
    onAdd({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unit: unit || undefined,
      quantity,
      unitPrice,
    });
    setQuantity(1);
    setUnit("");
    setUnitPrice(undefined);
  };

  return (
    <div className="rounded-md border p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
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
          <div className="text-xs text-muted-foreground mb-1">Quantity</div>
          <Input
            type="number"
            min={0}
            value={Number.isFinite(quantity) ? quantity : 0}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Unit</div>
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
