"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StockTransferForm from "@/components/stock/StockTransferForm";
import StockTransferHistory from "@/components/stock/StockTransferHistory";

const StockTransfers = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransferSuccess = () => {
    // Increment key to force refresh of history
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Stock Transfers</h1>
        <p className="text-muted-foreground">
          Transfer inventory between warehouses and track stock movements
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Stock Transfer</CardTitle>
          <CardDescription>
            Transfer stock between Main Warehouse and Secondary Warehouse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockTransferForm onSuccess={handleTransferSuccess} />
        </CardContent>
      </Card>

      <StockTransferHistory key={refreshKey} />
    </div>
  );
};

export default StockTransfers;