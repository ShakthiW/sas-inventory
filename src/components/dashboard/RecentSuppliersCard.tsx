"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import Link from "next/link";
import { Building2, Users } from "lucide-react";

type SupplierRow = {
  id: string;
  name: string;
  supplierType?: string;
  createdAt?: string | Date;
};

export default function RecentSuppliersCard() {
  const [rows, setRows] = React.useState<SupplierRow[]>([]);

  React.useEffect(() => {
    fetch("/api/inventory/suppliers?limit=5&sort=createdAt&dir=desc")
      .then((r) => r.json())
      .then((d) => setRows(d?.data || []))
      .catch(() => {});
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Suppliers</CardTitle>
          {/* <Link
            href="/inventory/suppliers"
            className="text-xs text-primary underline"
          >
            View All
          </Link> */}
        </div>
        <div className="mt-3 h-px bg-border" />
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No suppliers yet.</div>
        ) : (
          rows.map((s) => {
            const date = s.createdAt ? new Date(s.createdAt) : null;
            const isCompany = s.supplierType === "company";
            return (
              <div
                key={s.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {isCompany ? (
                      <Building2 className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Users className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {s.name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="text-blue-600">#{s.id.slice(-5)}</span>
                      <span>•</span>
                      <span>{date ? date.toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground capitalize">
                    {s.supplierType || "Individual"}
                  </div>
                  <div className="text-xs text-muted-foreground">Supplier</div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
