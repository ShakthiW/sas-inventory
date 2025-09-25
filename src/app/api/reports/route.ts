import { getDb } from "@/lib/db";
import type { NextRequest } from "next/server";

type RevenueResponse = {
  year: number;
  totalsByMonth: number[]; // length 12, Jan..Dec
  total: number;
  previousYearTotal: number | null;
  deltaPct: number | null; // YoY
};

function getYearBounds(year: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
  return { start, end };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const type = (url.searchParams.get("type") || "").toLowerCase();

  if (type !== "revenue") {
    // Handle additional report types
    if (type === "sales-pie") {
      const year = parseInt(
        url.searchParams.get("year") || String(new Date().getUTCFullYear()),
        10
      );
      const month = parseInt(
        url.searchParams.get("month") || String(new Date().getUTCMonth() + 1),
        10
      );

      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

      const db = await getDb();
      const batches = db.collection("stock_batches");

      // Sum quantities per product name for stock-out batches within month
      const pipeline: Record<string, unknown>[] = [
        { $match: { type: "out", createdAt: { $gte: start, $lt: end } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: { $ifNull: ["$items.name", "Unknown"] },
            count: { $sum: { $ifNull: ["$items.quantity", 0] } },
          },
        },
        { $sort: { count: -1 } },
      ];

      type Row = { _id: string; count: number };
      const rows = (await batches.aggregate<Row>(pipeline).toArray()) as Row[];

      const topN = 5;
      const top = rows.slice(0, topN);
      const othersSum = rows
        .slice(topN)
        .reduce((a, b) => a + (b?.count || 0), 0);
      const total = rows.reduce((a, b) => a + (b?.count || 0), 0);

      const data = [
        ...top.map((r, idx) => ({
          key: `k${idx + 1}`,
          label: r._id,
          value: r.count,
        })),
        ...(othersSum > 0
          ? [{ key: "others", label: "Others", value: othersSum }]
          : []),
      ];

      return Response.json({
        month,
        year,
        total,
        data, // keys map to chart config colors on frontend
      });
    }

    return Response.json({ error: "Unsupported report type" }, { status: 400 });
  }

  const year = parseInt(
    url.searchParams.get("year") || String(new Date().getUTCFullYear()),
    10
  );

  const db = await getDb();
  const batches = db.collection("stock_batches");

  // Helper to run monthly aggregation for a given year
  async function revenueForYear(y: number): Promise<number[]> {
    const { start, end } = getYearBounds(y);

    const pipeline: Record<string, unknown>[] = [
      { $match: { type: "out", createdAt: { $gte: start, $lt: end } } },
      { $unwind: "$items" },
      // Lookup product price as fallback when unitPrice not provided
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $addFields: {
          price: {
            $ifNull: [
              "$items.unitPrice",
              { $arrayElemAt: ["$product.pricing.price", 0] },
            ],
          },
        },
      },
      {
        $addFields: {
          revenue: {
            $multiply: ["$items.quantity", { $ifNull: ["$price", 0] }],
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$revenue" },
        },
      },
      { $project: { month: "$_id", _id: 0, total: 1 } },
      { $sort: { month: 1 } },
    ];

    type Row = { month: number; total: number };
    const rows = (await batches.aggregate<Row>(pipeline).toArray()) as Row[];
    const byMonth = Array(12).fill(0) as number[];
    for (const r of rows) {
      const idx = Math.max(1, Math.min(12, r.month)) - 1;
      byMonth[idx] = r.total;
    }
    return byMonth;
  }

  const [thisYear, prevYear] = await Promise.all([
    revenueForYear(year),
    revenueForYear(year - 1),
  ]);

  const total = thisYear.reduce((a, b) => a + b, 0);
  const prevTotal = prevYear.reduce((a, b) => a + b, 0);
  const deltaPct =
    prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;

  const response: RevenueResponse = {
    year,
    totalsByMonth: thisYear,
    total,
    previousYearTotal: prevTotal || null,
    deltaPct,
  };

  return Response.json(response);
}
