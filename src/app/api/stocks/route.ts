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
      return Response.json({
        batchId: rec._id.toString(),
        type: rec.type ?? "in",
        batchName: rec.batchName,
        createdAt: rec.createdAt ?? null,
        items,
      });
    }

    // List batches with pagination
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
      100
    );
    const filter: Record<string, unknown> = {};
    const total = await batches.countDocuments(filter);
    const docs = await batches
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const data = docs.map((d) => {
      const rec = d as unknown as {
        _id: ObjectId;
        items?: unknown[];
        type?: string;
        batchName?: string;
        createdAt?: Date;
      };
      return {
        id: rec._id.toString(),
        type: rec.type ?? "in",
        batchName: rec.batchName,
        itemsCount: Array.isArray(rec.items) ? rec.items.length : 0,
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
