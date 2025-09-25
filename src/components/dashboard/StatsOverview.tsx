"use client";

import React, { useEffect, useState } from "react";
import StatCard from "./StatCard";
import { Building2, Package2, Users, Layers3 } from "lucide-react";

type DashboardStats = {
  totals: {
    products: number;
    lowStock: number;
    suppliers: number;
    categories: number;
    batches: number;
  };
  deltas: {
    products: number | null;
    suppliers: number | null;
  };
};

export default function StatsOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data: DashboardStats) => {
        if (isMounted) setStats(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-4">
      <StatCard
        label="Total Products"
        value={stats?.totals.products ?? "—"}
        deltaPct={stats?.deltas.products ?? null}
        icon={<Package2 className="h-5 w-5" />}
        barsColorClass="text-orange-500"
      />
      <StatCard
        label="Low Stock Items"
        value={stats?.totals.lowStock ?? "—"}
        deltaPct={null}
        icon={<Layers3 className="h-5 w-5" />}
        barsColorClass="text-violet-500"
      />
      <StatCard
        label="Suppliers"
        value={stats?.totals.suppliers ?? "—"}
        deltaPct={stats?.deltas.suppliers ?? null}
        icon={<Users className="h-5 w-5" />}
        barsColorClass="text-cyan-500"
      />
      <StatCard
        label="Categories"
        value={stats?.totals.categories ?? "—"}
        deltaPct={null}
        icon={<Building2 className="h-5 w-5" />}
        barsColorClass="text-emerald-500"
      />
    </div>
  );
}
