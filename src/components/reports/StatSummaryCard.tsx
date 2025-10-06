"use client";

import { Card, CardContent } from "@/components/ui/card";
import React from "react";

type StatSummaryCardProps = {
  title: string;
  value: string;
  bgClass?: string;
  textClass?: string;
  iconSrc: string;
  iconColorClass?: string;
  iconSize?: number;
  className?: string;
};

function ColorizedSvg({
  src,
  colorClass = "bg-white",
  size = 56,
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

export function StatSummaryCard({
  title,
  value,
  bgClass = "bg-orange-500",
  textClass = "text-white",
  iconSrc,
  iconColorClass = "bg-white",
  iconSize = 120,
  className,
}: StatSummaryCardProps) {
  return (
    <Card
      className={`rounded-xl border-0 ${bgClass} ${textClass} ${
        className ?? ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-3xl font-extrabold tracking-tight">{value}</p>
            <p className="mt-3 text-base/6 opacity-95">{title}</p>
          </div>
          <div className="shrink-0">
            <ColorizedSvg
              src={iconSrc}
              colorClass={iconColorClass}
              size={iconSize}
              alt={title}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatSummaryCard;
