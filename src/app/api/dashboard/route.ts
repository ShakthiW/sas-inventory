import { getDb } from "@/lib/db";

function percentageChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export async function GET() {
  const db = await getDb();

  const products = db.collection("products");
  const suppliers = db.collection("suppliers");
  const categories = db.collection("product_categories");
  const batches = db.collection("stock_batches");

  const now = new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const last7 = new Date(now.getTime() - sevenDaysMs);
  const prev7Start = new Date(now.getTime() - 2 * sevenDaysMs);

  // Core counts
  const [
    totalProducts,
    lowStockProducts,
    totalSuppliers,
    totalCategories,
    totalBatches,
  ] = await Promise.all([
    products.countDocuments({}),
    products.countDocuments({
      "pricing.qtyAlert": { $gt: 0 },
      "pricing.quantity": { $ne: null },
      $expr: { $lte: ["$pricing.quantity", "$pricing.qtyAlert"] },
    }),
    suppliers.countDocuments({}),
    categories.countDocuments({}),
    batches.countDocuments({}),
  ]);

  // Changes (last 7 days vs previous 7 days) where applicable
  const [productsLast7, productsPrev7, suppliersLast7, suppliersPrev7] =
    await Promise.all([
      products.countDocuments({ createdAt: { $gte: last7 } }),
      products.countDocuments({ createdAt: { $gte: prev7Start, $lt: last7 } }),
      suppliers.countDocuments({ createdAt: { $gte: last7 } }),
      suppliers.countDocuments({ createdAt: { $gte: prev7Start, $lt: last7 } }),
    ]);

  const productDelta = percentageChange(productsLast7, productsPrev7);
  const supplierDelta = percentageChange(suppliersLast7, suppliersPrev7);

  return Response.json({
    totals: {
      products: totalProducts,
      lowStock: lowStockProducts,
      suppliers: totalSuppliers,
      categories: totalCategories,
      batches: totalBatches,
    },
    deltas: {
      products: productDelta, // percentage
      suppliers: supplierDelta, // percentage
    },
  });
}
