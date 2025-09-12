import React from "react";
import SubCategoriesTable from "@/components/inventory/categories/subcategories/SubCategoriesTable";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <SubCategoriesTable />
    </div>
  );
}
