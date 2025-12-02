import React from "react";
import ProductTable from "@/components/inventory/products/ProductTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <div className="flex items-start w-full justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Products</h1>
            <p className="text-muted-foreground">
              Manage your product catalog, inventory levels, and pricing
            </p>
          </div>
          <Button asChild>
            <Link href="/inventory/create-product">
              <Plus />
              Create Product
            </Link>
          </Button>
        </div>
      </div>
      <ProductTable />
    </div>
  );
}
