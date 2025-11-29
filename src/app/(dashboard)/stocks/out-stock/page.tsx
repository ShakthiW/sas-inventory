"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const ProductSearch = dynamic(
  () => import("@/components/stock/addStock/ProductSearch"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        Loading search…
      </div>
    ),
  }
);

type CartItem = {
  productId: string;
  name: string;
  sku?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
};

type ProductsApiResponse = {
  data: Array<{
    id?: string;
    _id?: string;
    name: string;
    sku?: string;
    pricing?: { price?: number; quantity?: number };
  }>;
};

export default function Page() {
  const [qr, setQr] = React.useState("");
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isPending, startTransition] = React.useTransition();
  const [committing, setCommitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addProductToCart = React.useCallback(
    (p: {
      id: string;
      name: string;
      sku?: string;
      price?: number;
      unit?: string;
    }) => {
      startTransition(() => {
        setCart((prev) => {
          // When unit is specified (from QR code), match by both productId and unit
          // Otherwise, match by productId only
          const idx = p.unit
            ? prev.findIndex(
                (it) => it.productId === p.id && it.unit === p.unit
              )
            : prev.findIndex((it) => it.productId === p.id && !it.unit);

          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
            return copy;
          }
          return [
            ...prev,
            {
              productId: p.id,
              name: p.name,
              sku: p.sku,
              unit: p.unit,
              quantity: 1,
              unitPrice: p.price,
            },
          ];
        });
      });
    },
    [startTransition]
  );

  // Parse SASINV QR strings like:
  // SASINV:1|P:68bc170cb556db55bbe1053b|U:New base unit |S:TES-PRI-HGA9TP
  // or SASINV:1|P:68bc142cb556db55bbe1053a|S:ANO-PRO-93RK9J
  const parseSasInv = React.useCallback(
    (
      raw: string
    ): { productId?: string; sku?: string; unit?: string } | null => {
      const text = raw.trim();
      if (!text) return null;
      if (!text.startsWith("SASINV:")) return null;
      const parts = text.split("|");
      const result: { productId?: string; sku?: string; unit?: string } = {};
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith("P:")) {
          result.productId = trimmed.slice(2).trim();
        } else if (trimmed.startsWith("S:")) {
          result.sku = trimmed.slice(2).trim();
        } else if (trimmed.startsWith("U:")) {
          result.unit = trimmed.slice(2).trim();
        }
      }
      if (!result.productId && !result.sku) return null;
      return result;
    },
    []
  );

  const resolveProductById = React.useCallback(async (id: string) => {
    try {
      const params = new URLSearchParams({ id, limit: "1" });
      const res = await fetch(`/api/inventory/products?${params.toString()}`);
      const json: ProductsApiResponse = await res.json();
      const row = json?.data?.[0];
      if (!row) return null;
      return {
        id: (row.id || row._id || id) as string,
        name: row.name,
        sku: row.sku,
        price: row?.pricing?.price,
      } as { id: string; name: string; sku?: string; price?: number };
    } catch {
      return null;
    }
  }, []);

  const resolveProductByCode = React.useCallback(async (code: string) => {
    try {
      const params = new URLSearchParams({ q: code, page: "1", limit: "8" });
      const res = await fetch(`/api/inventory/products?${params.toString()}`);
      const json: ProductsApiResponse = await res.json();
      const rows = json?.data || [];
      if (rows.length === 0) return null;
      // Prefer exact SKU match; else fallback to first result
      const exact = rows.find((r) => (r.sku || "").trim() === code);
      const chosen = exact || rows[0];
      return {
        id: (chosen.id || chosen._id || code) as string,
        name: chosen.name,
        sku: chosen.sku,
        price: chosen?.pricing?.price,
      } as { id: string; name: string; sku?: string; price?: number };
    } catch {
      return null;
    }
  }, []);

  const handleQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scanned = qr.trim();
    if (!scanned) return;

    // Try SASINV parsing first
    const parsed = parseSasInv(scanned);
    let chosen: {
      id: string;
      name: string;
      sku?: string;
      price?: number;
      unit?: string;
    } | null = null;

    if (parsed) {
      // For SASINV payloads, require productId and resolve strictly by id.
      if (!parsed.productId) {
        toast.error("Invalid SASINV QR", {
          description: "Missing product id in scanned code.",
        });
        setQr("");
        inputRef.current?.focus();
        return;
      }
      const product = await resolveProductById(parsed.productId);
      if (!product) {
        toast.error("Product not found", {
          description: "The scanned product id does not exist.",
        });
        setQr("");
        inputRef.current?.focus();
        return;
      }
      // Include the unit from the QR code
      chosen = { ...product, unit: parsed.unit };
    } else {
      // Non-SASINV: treat as manual QR/barcode or SKU search as before
      chosen = await resolveProductByCode(scanned);
      if (!chosen) {
        toast.message("Code not recognized", {
          description: scanned,
        });
        setQr("");
        inputRef.current?.focus();
        return;
      }
    }

    addProductToCart(chosen);
    const unitInfo = chosen.unit ? ` (${chosen.unit})` : "";
    toast.success("Added to out stock", {
      description: `${chosen.name}${unitInfo}`,
    });
    setQr("");
    // Keep focus for next scan
    inputRef.current?.focus();
  };

  const increment = (index: number) => {
    startTransition(() => {
      setCart((prev) => {
        const copy = [...prev];
        copy[index] = { ...copy[index], quantity: copy[index].quantity + 1 };
        return copy;
      });
    });
  };

  const decrement = (index: number) => {
    startTransition(() => {
      setCart((prev) => {
        const copy = [...prev];
        const nextQty = Math.max(0, copy[index].quantity - 1);
        if (nextQty === 0) {
          copy.splice(index, 1);
          return copy;
        }
        copy[index] = { ...copy[index], quantity: nextQty };
        return copy;
      });
    });
  };

  const removeAt = (index: number) => {
    startTransition(() => {
      setCart((prev) => prev.filter((_, i) => i !== index));
    });
  };

  const subtotal = React.useMemo(
    () => cart.reduce((sum, it) => sum + (it.unitPrice || 0) * it.quantity, 0),
    [cart]
  );

  const handleUpdateStocks = async () => {
    if (cart.length === 0 || committing) return;
    setCommitting(true);
    try {
      const res = await fetch("/api/stocks/out-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error || `Request failed (${res.status})`;
        throw new Error(msg);
      }
      const json = await res.json();
      toast.success("Stocks updated", {
        description: json?.batchId ? `Batch ${json.batchId}` : undefined,
      });
      setCart([]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      toast.error("Failed to update stocks", { description: message });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-4 p-4 h-[calc(100vh-4rem)]">
      <div className="grid gap-4 md:grid-cols-3 h-full min-h-0">
        {/* Left: QR + Product Search */}
        <div className="md:col-span-2 flex min-h-0 flex-col gap-4">
          <div className="rounded-xl border p-4">
            <div className="text-sm font-medium mb-2">QR / Barcode</div>
            <form onSubmit={handleQrSubmit} className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={qr}
                onChange={(e) => setQr(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    // Trigger submit for keyboard-wedge scanners
                    void handleQrSubmit(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Scan or enter code…"
                className="h-11"
                autoFocus
              />
              <Button type="submit" className="h-11" disabled={isPending}>
                Add
              </Button>
            </form>
            <div className="text-xs text-muted-foreground mt-2">
              Focus the input and scan a QR/barcode to add.
            </div>
          </div>

          <div className="rounded-xl border p-4 flex-1 min-h-0 flex flex-col">
            <div className="text-sm font-medium mb-2">Find Products</div>
            <div className="flex-1 min-h-0 overflow-auto">
              <ProductSearch
                onSelect={(p) => {
                  addProductToCart({
                    id: (p.id ?? "") as string,
                    name: p.name,
                    sku: p.sku,
                    price: p.pricing?.price,
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="rounded-xl border p-4 flex min-h-0 flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Out Stock Items</div>
            <div className="text-sm text-muted-foreground">
              Items: {cart.length} · Subtotal: {subtotal}
            </div>
          </div>
          <div className="rounded-md border flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="w-[160px]">Quantity</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center">
                      No items yet. Scan or search to add.
                    </TableCell>
                  </TableRow>
                ) : (
                  cart.map((it, idx) => (
                    <TableRow key={`${it.productId}-${it.unit || "default"}-${idx}`}>
                      <TableCell className="font-medium">{it.name}</TableCell>
                      <TableCell>{it.sku || "-"}</TableCell>
                      <TableCell>
                        {it.unit ? (
                          <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted">
                            {it.unit}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => decrement(idx)}
                            disabled={isPending}
                          >
                            −
                          </Button>
                          <Input
                            className="h-9 w-16 text-center cursor-default select-none"
                            type="text"
                            readOnly
                            value={it.quantity}
                            onKeyDown={(e) => e.preventDefault()}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => increment(idx)}
                            disabled={isPending}
                          >
                            +
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeAt(idx)}
                          disabled={isPending}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Review items and click update when ready.
            </div>
            <Button
              disabled={cart.length === 0 || isPending || committing}
              onClick={handleUpdateStocks}
            >
              Update Stocks
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
