import React from "react";
import SupplierTable from "@/components/inventory/suppliers/SupplierTable";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Suppliers</h1>
        <p className="text-muted-foreground">
          Manage your supplier directory and contact information
        </p>
        
      </div>
      <SupplierTable />
    </div>
  );
}
