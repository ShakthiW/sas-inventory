"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import Link from "next/link";
import { Package } from "lucide-react";

type ProductRow = {
  id: string;
  name: string;
  sku?: string;
  createdAt?: string | Date;
};

export default function RecentProductsCard() {
  const [rows, setRows] = React.useState<ProductRow[]>([]);

  React.useEffect(() => {
    fetch("/api/inventory/products?limit=5&sort=createdAt&dir=desc")
      .then((r) => r.json())
      .then((d) => setRows(d?.data || []))
      .catch(() => {});
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Products</CardTitle>
          {/* <Link
            href="/inventory/products"
            className="text-xs text-primary underline"
          >
            View All
          </Link> */}
        </div>
        <div className="mt-3 h-px bg-border" />
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No products yet.</div>
        ) : (
          rows.map((p) => {
            const date = p.createdAt ? new Date(p.createdAt) : null;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="text-blue-600">
                        #{p.sku || p.id.slice(-5)}
                      </span>
                      <span>•</span>
                      <span>{date ? date.toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground">New</div>
                  <div className="text-xs text-muted-foreground">Product</div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
