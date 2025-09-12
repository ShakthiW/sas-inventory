"use client";

import React from "react";
import ProductInformation from "@/components/inventory/ProductInformation";
import PricingStock from "@/components/inventory/PricingStock";
import ImageInput from "@/components/inventory/ImageInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ProductInformationForm, PricingStockForm } from "@/lib/types";

export default function Page() {
  const [info, setInfo] = React.useState<ProductInformationForm | null>(null);
  const [pricing, setPricing] = React.useState<PricingStockForm | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imageFile, setImageFile] = React.useState<File | null>(null);

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
    } catch (e) {
      toast.error("Network error while adding product " + e);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
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
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSubmit}>Add Product</Button>
      </div>
    </div>
  );
}
