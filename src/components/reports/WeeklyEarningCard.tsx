"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type WeeklyEarningCardProps = {
  title?: string;
  amount?: string;
  changePercent?: string;
  changeLabel?: string;
  iconSrc?: string;
};

export function WeeklyEarningCard({
  title = "Weekly Earning",
  amount = "$95000.45",
  changePercent = "48%",
  changeLabel = "increase compare to last week",
  iconSrc = "/income.svg",
}: WeeklyEarningCardProps) {
  return (
    <Card className="border rounded-xl md:col-span-3">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[20px] font-semibold text-orange-500">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {amount}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                {changePercent}
              </span>
              <span className="text-slate-500">{changeLabel}</span>
            </div>
          </div>
          <div className="shrink-0">
            <Image
              src={iconSrc}
              alt="income icon"
              width={120}
              height={120}
              priority
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WeeklyEarningCard;
