import { z } from "zod";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { NextRequest } from "next/server";
import type { StockTransferDoc, StockTransferListItem } from "@/lib/types";
import { WAREHOUSES } from "@/lib/types";

const stockTransferItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  sku: z.string().optional(),
  quantity: z.number().int().positive(),
});

const stockTransferSchema = z.object({
  fromWarehouse: z.enum(["warehouse-1", "warehouse-2"]),
  toWarehouse: z.enum(["warehouse-1", "warehouse-2"]),
  items: z.array(stockTransferItemSchema).min(1, "At least one product is required"),
  date: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = stockTransferSchema.safeParse(json);
    
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid payload",
          issues: parsed.error.flatten((i) => i.message),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate: from and to warehouses must be different
    if (data.fromWarehouse === data.toWarehouse) {
      return Response.json(
        { error: "Source and destination warehouses must be different" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const transfers = db.collection("stock_transfers");
    const products = db.collection("products");

    // Ensure indexes
    await Promise.allSettled([
      transfers.createIndex({ createdAt: 1 }),
      transfers.createIndex({ productId: 1 }),
      transfers.createIndex({ fromWarehouse: 1 }),
      transfers.createIndex({ toWarehouse: 1 }),
    ]);

    const now = new Date();
    const transferDate = data.date ? new Date(data.date) : now;

    // Validate all products exist and get their details
    const productIds = data.items.map((item) => new ObjectId(item.productId));
    const productDocs = await products.find({ _id: { $in: productIds } }).toArray();
    
    if (productDocs.length !== data.items.length) {
      return Response.json(
        { error: "One or more products not found" },
        { status: 404 }
      );
    }

    // Build product map for quick lookup
    const productMap = new Map(
      productDocs.map((p) => [p._id.toString(), p])
    );

    // Calculate warehouse stock for all products
    const batches = db.collection("stock_batches");
    const batchDocs = await batches.find({}).toArray();
    
    const warehouseStockMap: Record<string, { "warehouse-1": number; "warehouse-2": number }> = {};

    batchDocs.forEach((batch) => {
      const items = batch.items as Array<{
        productId: string;
        quantity: number;
        warehouse?: "warehouse-1" | "warehouse-2";
      }>;

      if (Array.isArray(items)) {
        items.forEach((item) => {
          const prodId = item.productId;
          if (!warehouseStockMap[prodId]) {
            warehouseStockMap[prodId] = { "warehouse-1": 0, "warehouse-2": 0 };
          }

          const warehouse = item.warehouse || "warehouse-1";
          const qty = item.quantity || 0;

          if (batch.type === "in") {
            warehouseStockMap[prodId][warehouse] += qty;
          } else if (batch.type === "out") {
            warehouseStockMap[prodId][warehouse] -= qty;
          }
        });
      }
    });

    // Validate sufficient stock for all items
    const errors: string[] = [];
    for (const item of data.items) {
      const available = warehouseStockMap[item.productId]?.[data.fromWarehouse] || 0;
      if (available < item.quantity) {
        errors.push(
          `${item.productName}: Only ${available} units available in source warehouse. Requested: ${item.quantity}`
        );
      }
    }

    if (errors.length > 0) {
      return Response.json(
        { 
          error: "Insufficient stock",
          details: errors.join("; ")
        },
        { status: 400 }
      );
    }

    // Create transfer records for each product
    const transferIds: string[] = [];
    const outBatchItems: Array<{
      productId: string;
      name: string;
      sku?: string;
      quantity: number;
      warehouse: "warehouse-1" | "warehouse-2";
      unit?: string;
      unitPrice: number;
    }> = [];
    const inBatchItems: Array<{
      productId: string;
      name: string;
      sku?: string;
      quantity: number;
      warehouse: "warehouse-1" | "warehouse-2";
      unit?: string;
      unitPrice: number;
    }> = [];

    // Create individual transfer records for each product
    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) continue;

      const transferDoc: Omit<StockTransferDoc, "_id"> = {
        fromWarehouse: data.fromWarehouse,
        toWarehouse: data.toWarehouse,
        productId: new ObjectId(item.productId),
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        date: transferDate,
        note: data.note,
        createdAt: now,
        updatedAt: now,
      };

      const result = await transfers.insertOne(transferDoc as unknown as Record<string, unknown>);
      transferIds.push(result.insertedId.toString());

      // Add to batch items
      outBatchItems.push({
        productId: item.productId,
        name: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        warehouse: data.fromWarehouse,
        unit: product.unit,
        unitPrice: product.pricing?.price || 0,
      });

      inBatchItems.push({
        productId: item.productId,
        name: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        warehouse: data.toWarehouse,
        unit: product.unit,
        unitPrice: product.pricing?.price || 0,
      });
    }

    const batchReference = transferIds[0];

    // Create OUT batch from source warehouse
    const outBatchDoc = {
      type: "out",
      batchName: `Transfer OUT - ${batchReference}`,
      items: outBatchItems,
      reference: `Transfer: ${batchReference}`,
      note: `Stock transfer to ${WAREHOUSES.find((w) => w.id === data.toWarehouse)?.name || data.toWarehouse}${data.note ? ` - ${data.note}` : ""}`,
      createdAt: now,
      updatedAt: now,
    };

    // Create IN batch to destination warehouse
    const inBatchDoc = {
      type: "in",
      batchName: `Transfer IN - ${batchReference}`,
      items: inBatchItems,
      reference: `Transfer: ${batchReference}`,
      note: `Stock transfer from ${WAREHOUSES.find((w) => w.id === data.fromWarehouse)?.name || data.fromWarehouse}${data.note ? ` - ${data.note}` : ""}`,
      createdAt: now,
      updatedAt: now,
    };

    // Insert both batch entries
    await batches.insertMany([
      outBatchDoc as unknown as Record<string, unknown>,
      inBatchDoc as unknown as Record<string, unknown>,
    ]);

    return Response.json({
      success: true,
      transferIds: transferIds,
      itemsTransferred: data.items.length,
      message: "Stock transfer completed successfully",
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const searchParams = request.nextUrl.searchParams;
    
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
      100
    );
    const sort = searchParams.get("sort") || "createdAt";
    const dir = (searchParams.get("dir") || "desc").toLowerCase() === "asc" ? 1 : -1;
    const warehouse = searchParams.get("warehouse") || "";

    const collection = db.collection("stock_transfers");

    // Build filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    
    if (warehouse && (warehouse === "warehouse-1" || warehouse === "warehouse-2")) {
      filter.$or = [
        { fromWarehouse: warehouse },
        { toWarehouse: warehouse },
      ];
    }

    // Count total
    const total = await collection.countDocuments(filter);

    // Fetch paginated results
    const docs = await collection
      .find(filter)
      .sort({ [sort]: dir })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Helper to get warehouse name
    const getWarehouseName = (id: string) => {
      const warehouse = WAREHOUSES.find((w) => w.id === id);
      return warehouse?.name || id;
    };

    // Transform to list items
    const data: StockTransferListItem[] = docs.map((doc) => ({
      id: doc._id?.toString() || "",
      fromWarehouse: doc.fromWarehouse as "warehouse-1" | "warehouse-2",
      fromWarehouseName: getWarehouseName(doc.fromWarehouse as string),
      toWarehouse: doc.toWarehouse as "warehouse-1" | "warehouse-2",
      toWarehouseName: getWarehouseName(doc.toWarehouse as string),
      productName: doc.productName as string,
      sku: doc.sku as string | undefined,
      quantity: doc.quantity as number,
      date: (doc.date as Date)?.toISOString() || "",
      note: doc.note as string | undefined,
      createdAt: (doc.createdAt as Date)?.toISOString() || "",
    }));

    const pages = Math.ceil(total / limit);

    return Response.json({
      data,
      meta: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
