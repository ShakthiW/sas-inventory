"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

type RevenueData = {
  year: number;
  totalsByMonth: number[]; // len 12
  total: number;
  previousYearTotal: number | null;
  deltaPct: number | null;
};

export default function RevenueChart({
  chartHeight = 260,
}: {
  chartHeight?: number;
}) {
  const [data, setData] = useState<RevenueData | null>(null);

  useEffect(() => {
    const year = new Date().getUTCFullYear();
    fetch(`/api/reports?type=revenue&year=${year}`)
      .then((r) => r.json())
      .then((d: RevenueData) => setData(d))
      .catch(() => {});
  }, []);

  const months = useMemo(
    () => [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    []
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Revenue</CardTitle>
          <div className="text-sm text-muted-foreground">
            {data?.year ?? new Date().getUTCFullYear()}
          </div>
        </div>
        <div className="text-2xl font-semibold">
          ${data?.total?.toLocaleString?.() ?? "—"}
        </div>
        {typeof data?.deltaPct === "number" ? (
          <div
            className={`text-sm ${
              data.deltaPct >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {data.deltaPct >= 0 ? "+" : ""}
            {data.deltaPct.toFixed(0)}% increased from last year
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {data ? (
          <ChartContainer
            config={{
              revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
            }}
            className="px-2 aspect-auto"
            style={{ height: chartHeight }}
          >
            <BarChart
              accessibilityLayer
              data={months.map((m, i) => ({
                month: m,
                revenue: data.totalsByMonth[i],
              }))}
              width={undefined as unknown as number}
              height={chartHeight}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--chart-1)" radius={8} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div
            className="animate-pulse rounded-md bg-muted"
            style={{ height: chartHeight }}
          />
        )}
      </CardContent>
    </Card>
  );
}
