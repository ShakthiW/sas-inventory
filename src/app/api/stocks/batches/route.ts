import { z } from "zod";
import { getDb } from "@/lib/db";

const stockLineItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
  batch: z.string().optional(),
});

const batchSchema = z.object({
  type: z.enum(["in", "out"]).default("in"),
  items: z.array(stockLineItemSchema).min(1),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = batchSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid payload",
          issues: parsed.error.flatten((i) => i.message),
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const db = await getDb();
    const batches = db.collection("stock_batches");

    await Promise.allSettled([
      batches.createIndex({ createdAt: 1 }),
      batches.createIndex({ updatedAt: 1 }),
    ]);

    const now = new Date();
    const doc = {
      type: payload.type,
      items: payload.items,
      reference: payload.reference ?? "",
      note: payload.note ?? "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await batches.insertOne(
      doc as unknown as Record<string, unknown>
    );
    return Response.json(
      { insertedId: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
