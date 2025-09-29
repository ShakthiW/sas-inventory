"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type SalesPieApi = {
  month: number;
  year: number;
  total: number;
  data: { key: string; label: string; value: number }[];
};

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export default function SalesPieChart({ maxSize = 200 }: { maxSize?: number }) {
  const [resp, setResp] = React.useState<SalesPieApi | null>(null);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    fetch(`/api/reports?type=sales-pie&year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d: SalesPieApi) => setResp(d))
      .catch(() => {});
  }, []);

  const chartData = React.useMemo(() => {
    if (!resp)
      return [] as Array<{ name: string; value: number; fill: string }>;
    return resp.data.map((d, i) => ({
      name: d.label,
      value: d.value,
      fill: COLORS[i % COLORS.length],
    }));
  }, [resp]);

  const chartConfig: ChartConfig = React.useMemo(() => {
    const cfg: ChartConfig = { value: { label: "Sold" } };
    chartData.forEach((d) => {
      cfg[d.name] = { label: d.name, color: d.fill };
    });
    return cfg;
  }, [chartData]);

  const total = resp?.total ?? 0;
  const subtitle = React.useMemo(() => {
    if (!resp) return "";
    const date = new Date(Date.UTC(resp.year, resp.month - 1, 1));
    return date.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [resp]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Items Sold</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square"
          style={{ maxHeight: maxSize }}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={90}
              strokeWidth={6}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            />
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  const active =
                    activeIndex != null ? chartData[activeIndex] : undefined;
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {active ? (
                        <>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 4}
                            className="fill-foreground text-xl font-semibold"
                          >
                            {active.value.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 14}
                            className="fill-muted-foreground text-xs"
                          >
                            {active.name}
                          </tspan>
                        </>
                      ) : (
                        <>
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-4xl font-bold"
                          >
                            {total.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Sold
                          </tspan>
                        </>
                      )}
                    </text>
                  );
                }
              }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Top 5 products grouped; others combined.
        </div>
      </CardFooter>
    </Card>
  );
}
