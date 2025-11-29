import { z } from "zod";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { StockLineItem } from "@/lib/types";

const stockLineItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
  batch: z.string().optional(),
});

const stockPayloadSchema = z.object({
  items: z.array(stockLineItemSchema).min(1),
  reference: z.string().optional(),
  note: z.string().optional(),
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

    const payload: {
      items: StockLineItem[];
      reference?: string;
      note?: string;
    } = parsed.data;
    const { items, reference = "", note = "" } = payload;
    const db = await getDb();
    const products = db.collection("products");
    const batches = db.collection("stock_batches");

    await Promise.allSettled([
      batches.createIndex({ createdAt: 1 }),
      batches.createIndex({ updatedAt: 1 }),
    ]);

    const now = new Date();
    const batchInsert = await batches.insertOne({
      type: "out",
      items,
      reference,
      note,
      createdAt: now,
      updatedAt: now,
    } as unknown as Record<string, unknown>);
    const batchId = batchInsert.insertedId.toString();

    // Aggregate quantities per productId
    // NO CONVERSION - remove quantities in the product's unit as-is
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
            $set: { updatedAt: new Date() },
            $inc: { "pricing.quantity": -qty },
          },
        },
      })
    );

    if (operations.length === 0) {
      return Response.json({ batchId, updated: 0 });
    }

    // Only update existing products; do not upsert on out-stock
    const result = await products.bulkWrite(operations, { ordered: false });

    return Response.json({
      batchId,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
