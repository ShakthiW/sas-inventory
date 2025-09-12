import React from "react";
import SupplierTable from "@/components/inventory/suppliers/SupplierTable";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <SupplierTable />
    </div>
  );
}
