import React from "react";
import {
  WelcomeBanner,
  StatsOverview,
  RevenueChart,
  SalesPieChart,
  RecentBatchesCard,
  RecentProductsCard,
  RecentSuppliersCard,
} from "@/components";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <WelcomeBanner />
      <StatsOverview />
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <RevenueChart />
        </div>
        <SalesPieChart />
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <RecentBatchesCard />
        <RecentProductsCard />
        <RecentSuppliersCard />
      </div>
    </div>
  );
}
