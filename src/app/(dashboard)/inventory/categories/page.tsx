"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryTable from "@/components/inventory/categories/CategoryTable";
import SubCategoriesTable from "@/components/inventory/categories/subcategories/SubCategoriesTable";
import BrandsTable from "@/components/inventory/brands/BrandsTable";
import UnitsOfMeasureTable from "@/components/inventory/unitsOfMeasurement/UnitsOfMeasureTable";

export default function CategoryManagementPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Category Management</h1>
        <p className="text-muted-foreground">
          Manage product categories, subcategories, brands, and units of measurement
        </p>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories">Product Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="units">Units of Measurement</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4 mt-0">
          <CategoryTable />
        </TabsContent>

        <TabsContent value="subcategories" className="space-y-4 mt-0">
          <SubCategoriesTable />
        </TabsContent>

        <TabsContent value="brands" className="space-y-4 mt-0">
          <BrandsTable />
        </TabsContent>

        <TabsContent value="units" className="space-y-4 mt-0">
          <UnitsOfMeasureTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
