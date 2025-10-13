import React from "react";
import WeeklyEarningCard from "@/components/reports/WeeklyEarningCard";
import StatSummaryCard from "@/components/reports/StatSummaryCard";
import StatHeroCard from "@/components/reports/StatHeroCard";
import KpiSummaryCard from "@/components/reports/KpiSummaryCard";
import OverallInformationCard from "@/components/reports/OverallInformationCard";

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

      {/* KPI row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <KpiSummaryCard
          title="Profit"
          value="Rs. 8,458,798"
          deltaPercent={35}
          iconSrc="/income.svg"
          iconSquareBgClass="bg-sky-50"
          iconColorClass="bg-sky-600"
        />
        <KpiSummaryCard
          title="Total Expenses"
          value="Rs. 8,980,097"
          deltaPercent={41}
          iconSrc="/purchases.svg"
          iconSquareBgClass="bg-orange-50"
          iconColorClass="bg-orange-500"
        />
        <KpiSummaryCard
          title="No of Items Sold"
          value="10,000+"
          deltaPercent={12}
          iconSrc="/sales.svg"
          iconSquareBgClass="bg-emerald-50"
          iconColorClass="bg-emerald-600"
        />
        <KpiSummaryCard
          title="Total Earnings"
          value="Rs. 12,540,320"
          deltaPercent={18}
          iconSrc="/income.svg"
          iconSquareBgClass="bg-indigo-50"
          iconColorClass="bg-indigo-600"
        />
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <OverallInformationCard className="min-h-[60vh]" />
      </div>
    </div>
  );
}
