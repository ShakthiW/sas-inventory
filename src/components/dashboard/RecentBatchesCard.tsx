"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

type BatchItem = {
  id: string;
  type: string;
  batchName?: string;
  itemsCount: number;
  createdAt: string | Date | null;
};

export default function RecentBatchesCard() {
  const [rows, setRows] = React.useState<BatchItem[]>([]);

  React.useEffect(() => {
    fetch("/api/stocks?page=1&limit=5")
      .then((r) => r.json())
      .then((d) => setRows(d?.data || []))
      .catch(() => {});
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Batches</CardTitle>
          {/* <Link
            href="/stocks/history"
            className="text-xs text-primary underline"
          >
            View All
          </Link> */}
        </div>
        <div className="mt-3 h-px bg-border" />
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No batches yet.</div>
        ) : (
          rows.map((b) => {
            const date = b.createdAt ? new Date(b.createdAt) : null;
            const isIn = (b.type || "in") === "in";
            return (
              <div
                key={b.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {isIn ? (
                      <ArrowDown className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowUp className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {b.batchName || `Batch #${b.id.slice(-5)}`}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="text-blue-600">
                        {isIn ? "Stock In" : "Stock Out"}
                      </span>
                      <span>•</span>
                      <span>{date ? date.toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground">
                    {b.itemsCount} items
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isIn ? "Added" : "Removed"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
