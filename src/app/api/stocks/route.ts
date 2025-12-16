import { z } from "zod";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { NextRequest } from "next/server";
import type { StockLineItem } from "@/lib/types";

const stockLineItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
  batch: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  supplier: z.string().optional(),
  warehouse: z.enum(["warehouse-1", "warehouse-2"]),
});

const stockPayloadSchema = z.object({
  items: z.array(stockLineItemSchema).min(1),
  batchName: z.string().min(1, "Batch name is required"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = stockPayloadSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid payload",
          issues: parsed.error.flatten((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { items, batchName } = parsed.data;
    const db = await getDb();
    const products = db.collection("products");

    // Persist the batch for later QR rendering
    const batches = db.collection("stock_batches");
    await Promise.allSettled([
      batches.createIndex({ createdAt: 1 }),
      batches.createIndex({ updatedAt: 1 }),
      batches.createIndex({ batchName: 1 }),
    ]);
    const now = new Date();
    const batchInsert = await batches.insertOne({
      type: "in",
      batchName,
      items,
      createdAt: now,
      updatedAt: now,
    } as unknown as Record<string, unknown>);
    const batchId = batchInsert.insertedId.toString();

    // Aggregate quantities per productId
    // NO CONVERSION - store quantities in the product's unit as-is
    const quantityByProductId = new Map<string, number>();
    for (const it of items) {
      const prev = quantityByProductId.get(it.productId) ?? 0;
      quantityByProductId.set(it.productId, prev + it.quantity);
    }

    const operations = Array.from(quantityByProductId.entries()).map(
      ([productId, qty]) => ({
        updateOne: {
          filter: { _id: new ObjectId(productId) },
          update: {
            $setOnInsert: { createdAt: new Date() },
            $set: { updatedAt: new Date() },
            $inc: { "pricing.quantity": qty },
          },
        },
      })
    );

    if (operations.length === 0) {
      return Response.json({ updated: 0 });
    }

    // Ensure pricing.quantity exists and is a number by initializing missing to 0
    // bulkWrite with upsert:false; only existing products are updated
    const result = await products.bulkWrite(operations, { ordered: false });

    return Response.json({
      batchId,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserts: result.upsertedCount,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const batchId = (searchParams.get("batchId") || "").trim();
  try {
    const db = await getDb();
    const batches = db.collection("stock_batches");

    if (batchId) {
      const doc = await batches.findOne({ _id: new ObjectId(batchId) });
      if (!doc) {
        return Response.json({ error: "Batch not found" }, { status: 404 });
      }
      const rec = doc as unknown as {
        _id: ObjectId;
        items?: unknown;
        type?: string;
        batchName?: string;
        createdAt?: Date;
      };
      const items = Array.isArray(rec.items)
        ? (rec.items as StockLineItem[])
        : [];
      
      // Fetch qrSize from products for each item
      const products = db.collection("products");
      const productIds = items.map(item => {
        try {
          return new ObjectId(item.productId);
        } catch {
          return null;
        }
      }).filter((id): id is ObjectId => id !== null);
      
      const productDocs = await products.find(
        { _id: { $in: productIds } },
        { projection: { _id: 1, qrSize: 1, itemsPerRow: 1 } }
      ).toArray();
      
      const qrSizeMap = new Map<string, string>();
      const itemsPerRowMap = new Map<string, number>();
      for (const p of productDocs) {
        const id = p._id instanceof ObjectId ? p._id.toString() : String(p._id);
        if (p.qrSize) qrSizeMap.set(id, String(p.qrSize));
        if (p.itemsPerRow) itemsPerRowMap.set(id, Number(p.itemsPerRow));
      }
      
      // Enrich items with qrSize and itemsPerRow
      const enrichedItems = items.map(item => ({
        ...item,
        qrSize: qrSizeMap.get(item.productId) || "100x50",
        itemsPerRow: itemsPerRowMap.get(item.productId) || 2,
      }));
      
      return Response.json({
        batchId: rec._id.toString(),
        type: rec.type ?? "in",
        batchName: rec.batchName,
        createdAt: rec.createdAt ?? null,
        items: enrichedItems,
      });
    }

    // List batches with pagination
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
      100
    );
    const sortDir = searchParams.get("sort") === "asc" ? 1 : -1;
    const filter: Record<string, unknown> = {};
    const total = await batches.countDocuments(filter);
    const docs = await batches
      .find(filter)
      .sort({ createdAt: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Fetch product info including qrSize for all batches
    const products = db.collection("products");
    const allProductIds = new Set<string>();
    for (const doc of docs) {
      const rec = doc as unknown as { items?: unknown[] };
      if (Array.isArray(rec.items)) {
        for (const item of rec.items as StockLineItem[]) {
          if (item.productId) allProductIds.add(item.productId);
        }
      }
    }

    const productObjectIds = Array.from(allProductIds).map(id => {
      try {
        return new ObjectId(id);
      } catch {
        return null;
      }
    }).filter((id): id is ObjectId => id !== null);

    const productDocs = await products.find(
      { _id: { $in: productObjectIds } },
      { projection: { _id: 1, qrSize: 1 } }
    ).toArray();

    const productQrSizeMap = new Map<string, string>();
    for (const p of productDocs) {
      const id = p._id instanceof ObjectId ? p._id.toString() : String(p._id);
      if (p.qrSize) productQrSizeMap.set(id, String(p.qrSize));
    }

    const data = docs.map((d) => {
      const rec = d as unknown as {
        _id: ObjectId;
        items?: unknown[];
        type?: string;
        batchName?: string;
        createdAt?: Date;
      };
      
      const items = Array.isArray(rec.items) ? (rec.items as StockLineItem[]) : [];
      const uniqueProductIds = new Set(items.map(i => i.productId));
      const productTypesCount = uniqueProductIds.size;
      
      // Determine label size
      let labelSize: string | undefined;
      if (productTypesCount === 1) {
        const productId = Array.from(uniqueProductIds)[0];
        const qrSize = productQrSizeMap.get(productId) || "100x50";
        labelSize = `${qrSize} mm`;
      } else if (productTypesCount > 1) {
        const sizes = Array.from(uniqueProductIds)
          .map(id => productQrSizeMap.get(id) || "100x50");
        const uniqueSizes = new Set(sizes);
        labelSize = uniqueSizes.size === 1 ? `${Array.from(uniqueSizes)[0]} mm` : "Multiple Label Sizes";
      }
      
      return {
        id: rec._id.toString(),
        type: rec.type ?? "in",
        batchName: rec.batchName,
        itemsCount: items.reduce((sum: number, item: StockLineItem) => sum + (item.quantity || 0), 0),
        productTypesCount,
        labelSize,
        createdAt: rec.createdAt ?? null,
      };
    });

    return Response.json({
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.max(Math.ceil(total / limit), 1),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
