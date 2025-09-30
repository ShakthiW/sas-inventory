import React from "react";
import WeeklyEarningCard from "@/components/reports/WeeklyEarningCard";
import StatSummaryCard from "@/components/reports/StatSummaryCard";
import StatHeroCard from "@/components/reports/StatHeroCard";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <WeeklyEarningCard />
        </div>
        <div className="flex gap-4">
          <StatSummaryCard
            title="No of Total Sales"
            value="10,000+"
            bgClass="bg-orange-500"
            textClass="text-white"
            iconSrc="/sales.svg"
            iconColorClass="bg-white"
            iconSize={120}
            className="rounded-2xl flex-1"
          />
          <StatHeroCard
            title="No of Purchased Goods"
            value="800+"
            iconSrc="/purchases.svg"
            bgClass="bg-[#0B2D46]"
            textClass="text-white"
            iconColorClass="bg-orange-400"
            className="rounded-2xl flex-1"
          />
        </div>
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
    </div>
  );
}
