import { z } from "zod";
import { getDb } from "@/lib/db";
import type { StockLineItem } from "@/lib/types";

const stockLineItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative().optional(),
  batch: z.string().optional(),
  warehouse: z.enum(["warehouse-1", "warehouse-2"]),
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
    const batches = db.collection("stock_batches");

    await Promise.allSettled([
      batches.createIndex({ createdAt: 1 }),
      batches.createIndex({ updatedAt: 1 }),
    ]);

    // Calculate current warehouse stock from batches to validate quantities
    const warehouseStockMap: Record<
      string,
      { "warehouse-1": number; "warehouse-2": number }
    > = {};

    const batchDocs = await batches.find({}).toArray();
    batchDocs.forEach((batch) => {
      const batchItems = batch.items as Array<{
        productId: string;
        quantity: number;
        warehouse?: "warehouse-1" | "warehouse-2";
      }>;

      if (Array.isArray(batchItems)) {
        batchItems.forEach((item) => {
          const prodIdStr = item.productId;
          const warehouse = item.warehouse || "warehouse-1";
          const qty = item.quantity || 0;

          if (!warehouseStockMap[prodIdStr]) {
            warehouseStockMap[prodIdStr] = {
              "warehouse-1": 0,
              "warehouse-2": 0,
            };
          }

          if (batch.type === "in") {
            warehouseStockMap[prodIdStr][warehouse] += qty;
          } else if (batch.type === "out") {
            warehouseStockMap[prodIdStr][warehouse] -= qty;
          }
        });
      }
    });

    // Validate that requested quantities don't exceed available stock
    const errors: string[] = [];
    for (const item of items) {
      const available = warehouseStockMap[item.productId]?.[item.warehouse] || 0;
      if (item.quantity > available) {
        const warehouseName = item.warehouse === "warehouse-1" ? "Main Warehouse" : "Secondary Warehouse";
        errors.push(
          `${item.name || item.productId}: Insufficient stock in ${warehouseName}. Available: ${available}, Requested: ${item.quantity}`
        );
      }
    }

    if (errors.length > 0) {
      return Response.json(
        {
          error: "Insufficient stock",
          details: errors,
        },
        { status: 400 }
      );
    }

    // Create the out-stock batch with warehouse information
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

    return Response.json({
      batchId,
      itemsProcessed: items.length,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
