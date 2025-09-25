"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type StatCardProps = {
  label: string;
  value: string | number;
  deltaPct?: number | null; // percentage, e.g. 13.01
  icon?: React.ReactNode;
  barsColorClass?: string; // e.g. text-orange-500
};

export default function StatCard({
  label,
  value,
  deltaPct,
  icon,
  barsColorClass = "text-orange-500",
}: StatCardProps) {
  return (
    <Card className="bg-card/50">
      <CardContent className="py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f1e3a] text-white">
              {icon}
            </div>
          </div>
          {typeof deltaPct === "number" ? (
            <Badge
              className={`rounded-md px-2 py-1 text-xs ${
                deltaPct >= 0
                  ? "bg-emerald-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {deltaPct >= 0 ? "+" : ""}
              {deltaPct.toFixed(2)}%
            </Badge>
          ) : null}
        </div>
        <div className="mt-6 flex items-end justify-between">
          <div>
            <div className="text-3xl font-semibold tracking-tight">{value}</div>
            <div className="mt-2 text-sm text-muted-foreground">{label}</div>
          </div>
          <div
            className={`ml-4 flex items-end gap-1 ${barsColorClass}`}
            aria-hidden
          >
            <div className="h-6 w-1 rounded bg-current/80" />
            <div className="h-9 w-1 rounded bg-current/80" />
            <div className="h-5 w-1 rounded bg-current/80" />
            <div className="h-10 w-1 rounded bg-current" />
            <div className="h-7 w-1 rounded bg-current/80" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
