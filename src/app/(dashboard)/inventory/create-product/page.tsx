"use client";

import React from "react";
import ProductInformation from "@/components/inventory/ProductInformation";
import PricingStock from "@/components/inventory/PricingStock";
import ImageInput from "@/components/inventory/ImageInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ProductInformationForm, PricingStockForm } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function Page() {
  const [info, setInfo] = React.useState<ProductInformationForm | null>(null);
  const [pricing, setPricing] = React.useState<PricingStockForm | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [justCreated, setJustCreated] = React.useState<null | {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
  }>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    const payload = {
      ...(info ?? {}),
      pricing: pricing
        ? {
            productType: pricing.productType,
            quantity: pricing.quantity,
            unit: pricing.unit,
            qtyAlert: pricing.qtyAlert,
            price: pricing.price,
            warehouse: pricing.warehouse,
          }
        : {},
      images: [],
    };

    try {
      const res = await fetch("/api/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "Failed to add product " + err);
        return;
      }

      const data = await res.json();
      toast.success("Product added successfully");
      console.log("Inserted:", data);

      // Save created product minimal info for quick-print flow
      const createdId = data?.insertedId as string | undefined;
      if (createdId) {
        setJustCreated({
          id: createdId,
          name: info?.name || "New Product",
          sku: info?.sku,
          unit: pricing?.unit,
        });
      }
    } catch (e) {
      toast.error("Network error while adding product " + e);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Create Product</h1>
        <p className="text-muted-foreground">
          Add a new product to your inventory with details, pricing, and images
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductInformation onChange={setInfo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <PricingStock onChange={setPricing} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <ImageInput onChange={(file) => setImageFile(file)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" onClick={() => router.push("/inventory/products")}>Cancel</Button>
        <Button onClick={handleSubmit}>Add Product</Button>
      </div>

      {/* Quick print bar after creation */}
      {justCreated ? (
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="text-sm">
            Ready to print QR for{" "}
            <span className="font-medium">{justCreated.name}</span>?
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                const payload = [
                  {
                    productId: justCreated.id,
                    name: justCreated.name,
                    sku: justCreated.sku,
                    unit: justCreated.unit,
                    quantity: 1,
                  },
                ];
                const url = `/stocks/qr-labels?autoprint=1&payload=${encodeURIComponent(
                  JSON.stringify(payload)
                )}`;
                window.open(url, "_blank");
              }}
            >
              Print QR (2×1)
            </Button>
            <Button variant="ghost" onClick={() => setJustCreated(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
