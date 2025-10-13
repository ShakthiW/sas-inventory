"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ShoppingCart,
  UsersRound,
  BadgeCheck,
  Calendar,
  ChevronDown,
} from "lucide-react";

type MiniStat = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
};

type OverallInformationCardProps = {
  title?: string;
  stats?: MiniStat[];
  firstTimeValue?: string;
  firstTimePercent?: number; // 0-100
  returnValue?: string;
  returnPercent?: number; // 0-100
  chartOuterPercent?: number; // 0-100
  chartInnerPercent?: number; // 0-100
  className?: string;
};

function IconBadge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}

function MetricTile({ label, value, icon }: MiniStat) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border px-6 py-6 text-center">
      <div className="flex items-center justify-center">{icon}</div>
      <div className="text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function MultiRingDonut({
  outerPercent,
  innerPercent,
}: {
  outerPercent: number;
  innerPercent: number;
}) {
  const outerData = [
    { name: "progress", value: Math.max(0, Math.min(outerPercent, 100)) },
    {
      name: "rest",
      value: Math.max(0, 100 - Math.max(0, Math.min(outerPercent, 100))),
    },
  ];
  const innerData = [
    { name: "progress", value: Math.max(0, Math.min(innerPercent, 100)) },
    {
      name: "rest",
      value: Math.max(0, 100 - Math.max(0, Math.min(innerPercent, 100))),
    },
  ];

  return (
    <ChartContainer
      config={{
        outer: { color: "#ea580c" },
        inner: { color: "#0ea5a4" },
      }}
      className="aspect-square h-[180px] w-[180px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={outerData}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            innerRadius={70}
            outerRadius={90}
            stroke="transparent"
          >
            <Cell key="outer-progress" fill="var(--color-outer)" />
            <Cell key="outer-rest" fill="#E5E7EB" />
          </Pie>
          <Pie
            data={innerData}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            innerRadius={40}
            outerRadius={60}
            stroke="transparent"
          >
            <Cell key="inner-progress" fill="var(--color-inner)" />
            <Cell key="inner-rest" fill="#E5E7EB" />
          </Pie>
          <RechartsTooltip cursor={false} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export default function OverallInformationCard({
  title = "Overall Information",
  stats = [
    {
      label: "Suppliers",
      value: 6987,
      icon: (
        <IconBadge className="bg-blue-50 text-blue-600">
          <BadgeCheck className="h-6 w-6" />
        </IconBadge>
      ),
    },
    {
      label: "Customer",
      value: 4896,
      icon: (
        <IconBadge className="bg-orange-50 text-orange-500">
          <UsersRound className="h-6 w-6" />
        </IconBadge>
      ),
    },
    {
      label: "Orders",
      value: 487,
      icon: (
        <IconBadge className="bg-emerald-50 text-emerald-600">
          <ShoppingCart className="h-6 w-6" />
        </IconBadge>
      ),
    },
  ],
  firstTimeValue = "5.5K",
  firstTimePercent = 25,
  returnValue = "3.5K",
  returnPercent = 21,
  className,
}: OverallInformationCardProps) {
  return (
    <Card className={`rounded-2xl border ${className ?? ""}`}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </h3>
        </div>

        <Separator className="my-5" />

        {/* Top mini stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s, idx) => (
            <MetricTile key={idx} {...s} />
          ))}
        </div>

        <Separator className="my-5" />

        {/* Customers Overview */}
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-slate-900">
            Customers Overview
          </h4>
          <Button variant="outline" className="gap-2 rounded-xl">
            <Calendar className="h-4 w-4" />
            Today
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          {/* Left metric */}
          <div className="text-center sm:text-left">
            <div className="text-4xl font-extrabold tracking-tight text-slate-900">
              {firstTimeValue}
            </div>
            <div className="mt-2 text-xl text-orange-600">First Time</div>
          </div>

          {/* Donut chart (center) */}
          <div className="flex justify-center">
            <MultiRingDonut
              outerPercent={firstTimePercent}
              innerPercent={returnPercent}
            />
          </div>

          {/* Right metric */}
          <div className="text-center sm:text-left">
            <div className="text-4xl font-extrabold tracking-tight text-slate-900">
              {returnValue}
            </div>
            <div className="mt-2 text-xl text-emerald-600">Returning</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
