"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type KpiSummaryCardProps = {
  title: string;
  value: string;
  deltaPercent: number; // e.g. 35 for +35%
  deltaLabel?: string; // e.g. "vs Last Month"
  iconSrc: string; // path to svg in public
  iconSquareBgClass?: string; // e.g. bg-sky-50
  iconColorClass?: string; // e.g. bg-sky-600
  className?: string;
  onViewAll?: () => void;
};

function MaskedIcon({
  src,
  colorClass = "bg-sky-600",
  size = 28,
  alt,
}: {
  src: string;
  colorClass?: string;
  size?: number;
  alt?: string;
}) {
  return (
    <div
      aria-label={alt}
      className={colorClass}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        width: size,
        height: size,
        display: "inline-block",
      }}
    />
  );
}

export default function KpiSummaryCard({
  title,
  value,
  deltaPercent,
  deltaLabel = "vs Last Month",
  iconSrc,
  iconSquareBgClass = "bg-sky-50",
  iconColorClass = "bg-sky-600",
  className,
  onViewAll,
}: KpiSummaryCardProps) {
  const positive = deltaPercent >= 0;
  return (
    <Card className={`rounded-2xl border ${className ?? ""}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[28px] font-extrabold tracking-tight text-slate-900">
              {value}
            </div>
            <div className="mt-2 text-slate-500">{title}</div>
          </div>
          <div
            className={`shrink-0 rounded-2xl ${iconSquareBgClass} p-3`}
            aria-hidden
          >
            <MaskedIcon
              src={iconSrc}
              colorClass={iconColorClass}
              size={28}
              alt={title}
            />
          </div>
        </div>

        <Separator className="my-5" />

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className={
                positive
                  ? "text-emerald-600 font-medium"
                  : "text-red-600 font-medium"
              }
            >
              {positive ? "+" : ""}
              {Math.abs(deltaPercent)}%
            </span>
            <span className="text-slate-500">{deltaLabel}</span>
          </div>
          <Button
            variant="link"
            size="sm"
            className="px-0 h-auto font-medium"
            onClick={onViewAll}
          >
            View All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
