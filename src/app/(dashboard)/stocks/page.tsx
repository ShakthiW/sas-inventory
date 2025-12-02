"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/* ---------------------------
   Types
   --------------------------- */
type StockTransaction = {
  _id: string;
  id?: string;
  type: string;
  itemsCount: number;
  createdAt: string | null;
};

/* ---------------------------
   Component
   --------------------------- */
export default function Page() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stocks?page=1&limit=4");
      const json = await res.json();

      const data: StockTransaction[] = Array.isArray(json.data)
        ? json.data
        : [];

      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch stock transactions:", err);
      toast.error("Failed to load stock transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  /* ---------------------------
     UI
     --------------------------- */
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-1">Stock Management</h1>
        <p className="text-muted-foreground">
          Manage inventory levels and track stock movements.
        </p>
      </div>

      {/* Stock In / Out Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-green-600" />
              Stock In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Add inventory to existing products.
            </p>
            <Button className="w-full" asChild>
              <Link href="/stocks/add-stock">Record Stock In</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-red-600" />
              Stock Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Record inventory reductions.
            </p>
            <Button variant="destructive" className="w-full" asChild>
              <Link href="/stocks/out-stock">Record Stock Out</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Stock Transactions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Stock Transactions</h2>
        <Button variant="outline" asChild>
          <Link href="/stocks/history">View More</Link>
        </Button>
      </div>

      {/* Transactions Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Batch ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Items Count</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : transactions.length > 0 ? (
              transactions.map((t) => (
                <TableRow key={t._id || t.id}>
                  <TableCell className="font-mono">
                    {(t._id || t.id)?.slice(-8) || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={t.type === "in" ? "default" : "destructive"}
                    >
                      {t.type === "in" ? "Stock In" : "Stock Out"}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.itemsCount}</TableCell>
                  <TableCell>
                    {t.createdAt
                      ? new Date(t.createdAt).toLocaleString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-muted-foreground"
                >
                  No stock transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
