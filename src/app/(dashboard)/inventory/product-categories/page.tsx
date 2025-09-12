import React from "react";
import CategoryTable from "@/components/inventory/categories/CategoryTable";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <CategoryTable />
    </div>
  );
}
