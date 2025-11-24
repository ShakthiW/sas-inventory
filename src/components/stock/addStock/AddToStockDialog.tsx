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

type UnitDetail = {
  id: string;
  name: string;
  shortName?: string;
  kind: "base" | "pack";
  baseUnitId?: string;
  unitsPerPack?: number;
};

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
  const [allUnits, setAllUnits] = React.useState<UnitDetail[]>([]);
  const [filteredUnits, setFilteredUnits] = React.useState<UnitDetail[]>([]);
  const [unit, setUnit] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const [batch, setBatch] = React.useState<string>("");
  const [baseUnitQuantity, setBaseUnitQuantity] = React.useState<string>("");
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
          kind: "base" | "pack";
          baseUnitId?: string;
          unitsPerPack?: number;
        }) => ({
          id: u.id || u._id,
          name: u.name,
          shortName: u.shortName,
          kind: u.kind,
          baseUnitId: u.baseUnitId,
          unitsPerPack: u.unitsPerPack,
        })
      );
      setAllUnits(data);
    };
    fetchUnits();
  }, [open]);

  React.useEffect(() => {
    // When product changes, filter units and auto-select default
    if (!product?.unit || allUnits.length === 0) {
      setFilteredUnits(allUnits);
      setUnit("");
      setQuantity(1);
      setBatch("");
      setBaseUnitQuantity("");
      return;
    }

    // Find the product's default unit
    const productUnit = allUnits.find((u) => u.id === product.unit);
    if (!productUnit) {
      setFilteredUnits(allUnits);
      setUnit("");
      setQuantity(1);
      setBatch("");
      setBaseUnitQuantity("");
      return;
    }

    // Filter to show related units: 
    // - If product unit is base, show it + all pack units that reference it
    // - If product unit is pack, show its base unit + all pack units that reference the same base
    let related: UnitDetail[] = [];
    if (productUnit.kind === "base") {
      // Show base unit + all packs that reference it
      related = allUnits.filter(
        (u) => u.id === productUnit.id || u.baseUnitId === productUnit.id
      );
    } else if (productUnit.kind === "pack" && productUnit.baseUnitId) {
      // Show base unit + all packs that reference the same base
      related = allUnits.filter(
        (u) =>
          u.id === productUnit.baseUnitId ||
          u.baseUnitId === productUnit.baseUnitId
      );
    }

    setFilteredUnits(related.length > 0 ? related : [productUnit]);
    setUnit(productUnit.name); // Auto-select the product's unit
    setQuantity(1);
    setBatch("");
  }, [product?.unit, product?.id, allUnits]);

  // Calculate base unit quantity whenever unit or quantity changes
  React.useEffect(() => {
    if (!unit || quantity <= 0 || filteredUnits.length === 0) {
      setBaseUnitQuantity("");
      return;
    }

    const selectedUnit = filteredUnits.find((u) => u.name === unit);
    if (!selectedUnit) {
      setBaseUnitQuantity("");
      return;
    }

    if (selectedUnit.kind === "base") {
      // Already in base units
      setBaseUnitQuantity(`${quantity} ${selectedUnit.name}${selectedUnit.shortName ? ` (${selectedUnit.shortName})` : ""}`);
    } else if (selectedUnit.kind === "pack" && selectedUnit.unitsPerPack) {
      // Convert pack to base units
      const baseQty = quantity * selectedUnit.unitsPerPack;
      const baseUnit = filteredUnits.find(
        (u) => u.id === selectedUnit.baseUnitId
      );
      const baseUnitName = baseUnit
        ? `${baseUnit.name}${baseUnit.shortName ? ` (${baseUnit.shortName})` : ""}`
        : "base units";
      setBaseUnitQuantity(`${baseQty} ${baseUnitName}`);
    }
  }, [unit, quantity, filteredUnits]);

  const canConfirm = !!product && quantity > 0 && !!unit;

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
                  <SelectValue placeholder="Choose unit" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUnits.map((u) => (
                    <SelectItem key={u.id} value={u.name}>
                      {u.name} {u.shortName ? `(${u.shortName})` : ""}
                      {u.kind === "pack" && u.unitsPerPack
                        ? ` - ${u.unitsPerPack} per pack`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Quantity</div>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setQuantity(Number(e.target.value))
                }
              />
            </div>
            <div className="sm:col-span-2">
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

            {/* Display base unit quantity for reference */}
            {baseUnitQuantity && (
              <div className="sm:col-span-2 rounded-md bg-muted/50 p-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Base Unit Quantity
                </div>
                <div className="text-sm font-semibold">
                  {baseUnitQuantity}
                </div>
              </div>
            )}
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
                  unit: unit || product.unit || undefined,
                  quantity,
                  unitPrice: product?.price,
                  batch: batch || undefined,
                  category: product.category,
                  subCategory: product.subCategory,
                  brand: product.brand,
                  supplier: product.supplier,
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
