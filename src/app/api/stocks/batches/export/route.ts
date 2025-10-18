import { ObjectId } from "mongodb";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import type { StockLineItem } from "@/lib/types";

function csvEscape(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (str === "") return "";
  const needsQuoting = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

type ProductPick = {
  _id: ObjectId;
  name?: string;
  sku?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  unit?: string;
};

export async function GET(request: NextRequest) {
  const batchId = (request.nextUrl.searchParams.get("batchId") || "").trim();
  if (!batchId || !ObjectId.isValid(batchId)) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing batchId" }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      }
    );
  }

  const db = await getDb();
  const batches = db.collection("stock_batches");
  const products = db.collection<ProductPick>("products");

  const batchDoc = await batches.findOne<{
    _id: ObjectId;
    items?: StockLineItem[];
  }>({ _id: new ObjectId(batchId) });
  if (!batchDoc) {
    return new Response(JSON.stringify({ error: "Batch not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  const items: StockLineItem[] = Array.isArray(batchDoc?.items)
    ? (batchDoc.items as StockLineItem[])
    : [];

  const productIds = Array.from(
    new Set(
      items
        .map((it) =>
          it.productId && ObjectId.isValid(it.productId) ? it.productId : null
        )
        .filter((v): v is string => Boolean(v))
    )
  ).map((id) => new ObjectId(id));

  const productDocs = productIds.length
    ? await products
        .find(
          { _id: { $in: productIds } },
          {
            projection: {
              sku: 1,
              name: 1,
              category: 1,
              subCategory: 1,
              brand: 1,
              unit: 1,
            },
          }
        )
        .toArray()
    : [];

  const productById = new Map<string, ProductPick>();
  for (const p of productDocs) {
    productById.set(String(p._id), p);
  }

  const header = [
    "sku",
    "product_id",
    "product_name",
    "supplier",
    "category",
    "subcategory",
    "brand",
    "unit",
  ];

  const lines: string[] = [];
  lines.push(header.join(","));

  for (const it of items) {
    const p = it.productId ? productById.get(it.productId) : undefined;
    const row = [
      csvEscape(it.sku ?? ""),
      csvEscape(it.productId ?? (p?._id ? String(p._id) : "")),
      csvEscape(p?.name ?? it.name ?? ""),
      csvEscape(it.supplier ?? ""),
      csvEscape(p?.category ?? it.category ?? ""),
      csvEscape(p?.subCategory ?? it.subCategory ?? ""),
      csvEscape(p?.brand ?? it.brand ?? ""),
      csvEscape(p?.unit ?? it.unit ?? ""),
    ];
    lines.push(row.join(","));
  }

  const csv = lines.join("\n");
  const filename = `batch_${batchId}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=${filename}`,
      "cache-control": "no-store",
    },
  });
}
