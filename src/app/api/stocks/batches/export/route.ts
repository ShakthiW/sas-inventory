import { ObjectId } from "mongodb";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import type { StockLineItem } from "@/lib/types";
import {
  buildTscTxtFromLabelData,
  type LabelData,
} from "@/lib/labels/templates";

type ProductPick = {
  _id: ObjectId;
  name?: string;
  sku?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  unit?: string;
  qrSize?: string;
  itemsPerRow?: number;
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
              qrSize: 1,
              itemsPerRow: 1,
            },
          }
        )
        .toArray()
    : [];

  const productById = new Map<string, ProductPick>();
  for (const p of productDocs) {
    productById.set(String(p._id), p);
  }

  // Build label data with product-specific settings
  const labels: (LabelData & { qrSize?: string; itemsPerRow?: number })[] = items.map((it) => {
    const productIdStr = it.productId ? String(it.productId) : "";
    const p = productIdStr ? productById.get(productIdStr) : undefined;
    const id = (productIdStr || (p?._id ? String(p._id) : "")).toString();
    const rawName = (p?.name ?? "").toString();
    const fallbackName = (it.name ?? "").toString();
    const name = rawName || fallbackName;
    const unit = (p?.unit ?? it.unit ?? "").toString();
    const qr = [id, name, unit].join("|");
    const qrSize = p?.qrSize || "100x50";
    const itemsPerRow = p?.itemsPerRow || 2;
    return { qr, name, id, qrSize, itemsPerRow };
  });

  // Group labels by qrSize and itemsPerRow to generate separate sections
  const groupedLabels = new Map<string, typeof labels>();
  for (const label of labels) {
    const key = `${label.qrSize}_${label.itemsPerRow}`;
    if (!groupedLabels.has(key)) {
      groupedLabels.set(key, []);
    }
    groupedLabels.get(key)!.push(label);
  }

  // Generate TSC output for each group
  const txtSections: string[] = [];
  for (const [key, groupLabels] of groupedLabels.entries()) {
    const [qrSize, itemsPerRowStr] = key.split('_');
    const size = (
      ["25x25", "100x50", "100x150"].includes(qrSize)
        ? qrSize
        : "100x50"
    ) as "25x25" | "100x50" | "100x150";
    const itemsPerRow = parseInt(itemsPerRowStr, 10) || 2;
    
    const txt = buildTscTxtFromLabelData(groupLabels, { itemsPerRow }, size);
    txtSections.push(txt);
  }

  const finalTxt = txtSections.join('\n\n');
  const filename = `batch_${batchId}.txt`;
  return new Response(finalTxt, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename=${filename}`,
      "cache-control": "no-store",
    },
  });
}
