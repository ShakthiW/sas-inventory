"use client";

import { Card, CardContent } from "@/components/ui/card";

type StatHeroCardProps = {
  title: string;
  value: string;
  iconSrc: string;
  bgClass?: string;
  textClass?: string;
  iconColorClass?: string;
  className?: string;
};

// Colorize arbitrary SVG by masking, but fill its container so we can size via width percentages
function MaskedSvgFill({
  src,
  colorClass,
  alt,
}: {
  src: string;
  colorClass: string;
  alt?: string;
}) {
  return (
    <div
      aria-label={alt}
      className={`${colorClass} w-full aspect-square`}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

export default function StatHeroCard({
  title,
  value,
  iconSrc,
  bgClass = "bg-[#0B2D46]",
  textClass = "text-white",
  iconColorClass = "bg-orange-400",
  className,
}: StatHeroCardProps) {
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
          <div className="shrink-0 w-1/4">
            <MaskedSvgFill
              src={iconSrc}
              colorClass={iconColorClass}
              alt={title}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
