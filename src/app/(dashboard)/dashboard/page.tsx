import React from "react";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import {
  WelcomeBanner,
  StatsOverview,
  RevenueChart,
  SalesPieChart,
  RecentBatchesCard,
  RecentProductsCard,
  RecentSuppliersCard,
} from "@/components";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  const name = session?.user?.name ?? "Admin";

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <WelcomeBanner adminName={name} />
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
