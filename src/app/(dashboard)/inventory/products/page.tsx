import React from "react";
import ProductTable from "@/components/inventory/products/ProductTable";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <ProductTable />
    </div>
  );
}
