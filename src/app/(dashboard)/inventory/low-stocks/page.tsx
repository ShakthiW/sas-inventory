import React from "react";
import LowStockTable from "@/components/inventory/products/LowStockTable";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <LowStockTable />
    </div>
  );
}
