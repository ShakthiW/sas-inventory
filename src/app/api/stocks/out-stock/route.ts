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
    const units = db.collection("units_of_measure");

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

    // Fetch all units to perform conversions
    const allUnits = await units.find({}).toArray();
    const unitMap = new Map(
      allUnits.map((u) => [
        u.name as string,
        {
          id: u._id.toString(),
          name: u.name as string,
          kind: (u.kind as string) || "base",
          baseUnitId: u.baseUnitId
            ? (u.baseUnitId as ObjectId).toString()
            : undefined,
          unitsPerPack: (u.unitsPerPack as number) || undefined,
        },
      ])
    );

    // Aggregate quantities per productId, converting pack units to base units
    const quantityByProductId = new Map<string, number>();
    for (const it of items) {
      let baseQuantity = it.quantity;

      // Convert pack units to base units
      if (it.unit) {
        const unitInfo = unitMap.get(it.unit);
        if (unitInfo && unitInfo.kind === "pack" && unitInfo.unitsPerPack) {
          baseQuantity = it.quantity * unitInfo.unitsPerPack;
        }
      }

      const prev = quantityByProductId.get(it.productId) ?? 0;
      quantityByProductId.set(it.productId, prev + baseQuantity);
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
