"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

type StockTransfer = {
  id: string;
  fromWarehouseName: string;
  toWarehouseName: string;
  productName: string;
  sku?: string;
  quantity: number;
  date: string;
  reference?: string;
  note?: string;
};

type Meta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export default function StockTransferHistory() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    page: 1,
    limit: 5,
    pages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const fetchTransfers = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/stock-transfers?limit=5&page=${page}&sort=createdAt&dir=desc`
      );
      const data = await response.json();
      if (data.data) {
        setTransfers(data.data);
      }
      if (data.meta) {
        setMeta(data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch transfers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers(1);
  }, []);

  const handleNextPage = () => {
    if (meta.hasNext) {
      fetchTransfers(meta.page + 1);
    }
  };

  const handlePrevPage = () => {
    if (meta.hasPrev) {
      fetchTransfers(meta.page - 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transfers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No stock transfers found. Create your first transfer above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transfer History</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Showing{" "}
            {transfers.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0} -{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">
                    {formatDate(transfer.date)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transfer.productName}</div>
                      {transfer.sku && (
                        <div className="text-sm text-muted-foreground">
                          SKU: {transfer.sku}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {transfer.fromWarehouseName}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">
                        {transfer.toWarehouseName}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {transfer.quantity}
                  </TableCell>
                  <TableCell>
                    {transfer.reference || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.pages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!meta.hasPrev || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!meta.hasNext || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
