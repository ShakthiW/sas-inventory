import { z } from "zod";
import { getDb } from "@/lib/db";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

// Zod schema mirroring our frontend forms
const pricingSchema = z
  .object({
    quantity: z.coerce.number().min(0).optional(),
    qtyAlert: z.coerce.number().min(0).optional(),
    price: z.coerce.number().min(0).optional(),
    warehouse: z.enum(["warehouse-1", "warehouse-2"]).optional(),
  })
  .optional();

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  supplier: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  pricing: pricingSchema,
  images: z.array(z.string()).optional(), // image URLs or paths if provided later
});

export async function GET(request: NextRequest) {
  const db = await getDb();

  const searchParams = request.nextUrl.searchParams;
  const id = (searchParams.get("id") || "").trim();
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
    100
  );
  const q = (searchParams.get("q") || "").trim();
  const sort = searchParams.get("sort") || "createdAt"; // createdAt | name | price
  const dir =
    (searchParams.get("dir") || "desc").toLowerCase() === "asc" ? 1 : -1;
  const stock = (searchParams.get("stock") || "").toLowerCase(); // '' | 'low' | 'near'

  const collection = db.collection("products");

  // Fast path: fetch by exact id when provided (for scanner flows)
  if (id) {
    try {
      if (!ObjectId.isValid(id)) {
        return Response.json({
          data: [],
          meta: {
            total: 0,
            page: 1,
            limit: 1,
            pages: 1,
            hasNext: false,
            hasPrev: false,
          },
        });
      }

      const doc = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!doc) {
        return Response.json({
          data: [],
          meta: {
            total: 0,
            page: 1,
            limit: 1,
            pages: 1,
            hasNext: false,
            hasPrev: false,
          },
        });
      }

      // Calculate warehouse stock for this product
      const batches = db.collection("stock_batches");
      const batchDocs = await batches.find({}).toArray();
      
      const warehouseStock = { "warehouse-1": 0, "warehouse-2": 0 };
      const productIdStr = doc._id?.toString();

      batchDocs.forEach((batch) => {
        const items = batch.items as Array<{
          productId: string;
          quantity: number;
          warehouse?: "warehouse-1" | "warehouse-2";
        }>;

        if (Array.isArray(items)) {
          items.forEach((item) => {
            if (item.productId === productIdStr) {
              const warehouse = item.warehouse || "warehouse-1";
              const qty = item.quantity || 0;

              if (batch.type === "in") {
                warehouseStock[warehouse] += qty;
              } else if (batch.type === "out") {
                warehouseStock[warehouse] -= qty;
              }
            }
          });
        }
      });

      const totalStock = warehouseStock["warehouse-1"] + warehouseStock["warehouse-2"];

      const data = [
        {
          ...doc,
          id: doc._id?.toString(),
          _id: undefined,
          warehouseStock,
          pricing: {
            ...doc.pricing,
            quantity: totalStock,
          },
        },
      ];

      return Response.json({
        data,
        meta: {
          total: data.length,
          page: 1,
          limit: 1,
          pages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    } catch (e: unknown) {
      return Response.json(
        {
          data: [],
          meta: {
            total: 0,
            page: 1,
            limit: 1,
            pages: 1,
            hasNext: false,
            hasPrev: false,
          },
          error: e instanceof Error ? e.message : "Unexpected server error",
        },
        { status: 500 }
      );
    }
  }

  const andClauses: Record<string, unknown>[] = [];
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    andClauses.push({
      $or: [
        { name: regex },
        { sku: regex },
        { category: regex },
        { brand: regex },
        { slug: regex },
      ],
    });
  }

  if (stock === "low" || stock === "near") {
    // Ensure alert exists and is > 0
    andClauses.push({ "pricing.qtyAlert": { $gt: 0 } });
    andClauses.push({ "pricing.quantity": { $ne: null } });
    if (stock === "low") {
      andClauses.push({
        $expr: { $lte: ["$pricing.quantity", "$pricing.qtyAlert"] },
      });
    } else if (stock === "near") {
      andClauses.push({
        $expr: {
          $lte: [
            "$pricing.quantity",
            { $multiply: ["$pricing.qtyAlert", 1.5] },
          ],
        },
      });
    }
  }

  const filter: Record<string, unknown> = andClauses.length
    ? { $and: andClauses }
    : {};

  const sortSpec: Record<string, 1 | -1> = {};
  if (sort === "price") sortSpec["pricing.price"] = dir as 1 | -1;
  else sortSpec[sort] = dir as 1 | -1;

  const total = await collection.countDocuments(filter);
  const docs = await collection
    .find(filter)
    .sort(sortSpec)
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  // Calculate warehouse-specific stock from stock_batches
  const productIds = docs
    .map((d) => d._id)
    .filter((id): id is ObjectId => !!id);
  const batches = db.collection("stock_batches");

  // Aggregate stock by product and warehouse
  const warehouseStockMap: Record<
    string,
    { "warehouse-1": number; "warehouse-2": number }
  > = {};

  if (productIds.length > 0) {
    const batchDocs = await batches.find({}).toArray();

    batchDocs.forEach((batch) => {
      const items = batch.items as Array<{
        productId: string;
        quantity: number;
        warehouse?: "warehouse-1" | "warehouse-2";
      }>;

      if (Array.isArray(items)) {
        items.forEach((item) => {
          const prodIdStr = item.productId;
          const warehouse = item.warehouse || "warehouse-1"; // Default to warehouse-1 for old records
          const qty = item.quantity || 0;

          if (!warehouseStockMap[prodIdStr]) {
            warehouseStockMap[prodIdStr] = {
              "warehouse-1": 0,
              "warehouse-2": 0,
            };
          }

          // Add for "in" type, subtract for "out" type
          if (batch.type === "in") {
            warehouseStockMap[prodIdStr][warehouse] += qty;
          } else if (batch.type === "out") {
            warehouseStockMap[prodIdStr][warehouse] -= qty;
          }
        });
      }
    });
  }

  const categoryIdStrings = new Set<string>();
  const brandIdStrings = new Set<string>();
  const supplierIdStrings = new Set<string>();

  docs.forEach((doc) => {
    const categoryValue = doc.category;
    if (categoryValue) {
      if (categoryValue instanceof ObjectId) {
        categoryIdStrings.add(categoryValue.toString());
      } else if (typeof categoryValue === "string") {
        categoryIdStrings.add(categoryValue);
      }
    }

    const brandValue = doc.brand;
    if (brandValue) {
      if (brandValue instanceof ObjectId) {
        brandIdStrings.add(brandValue.toString());
      } else if (typeof brandValue === "string") {
        brandIdStrings.add(brandValue);
      }
    }

    const supplierValue = doc.supplier;
    if (supplierValue) {
      if (supplierValue instanceof ObjectId) {
        supplierIdStrings.add(supplierValue.toString());
      } else if (typeof supplierValue === "string") {
        supplierIdStrings.add(supplierValue);
      }
    }
  });

  const categoryObjectIds = [...categoryIdStrings]
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  const brandObjectIds = [...brandIdStrings]
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  const supplierObjectIds = [...supplierIdStrings]
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const categoryMap: Record<string, string> = {};
  if (categoryObjectIds.length) {
    const categoriesCollection = db.collection("product_categories");
    const categories = await categoriesCollection
      .find({ _id: { $in: categoryObjectIds } }, { projection: { name: 1 } })
      .toArray();
    categories.forEach((cat) => {
      if (cat?._id) {
        categoryMap[cat._id.toString()] = cat.name;
      }
    });
  }

  const brandMap: Record<string, string> = {};
  if (brandObjectIds.length) {
    const brandsCollection = db.collection("brands");
    const brands = await brandsCollection
      .find({ _id: { $in: brandObjectIds } }, { projection: { name: 1 } })
      .toArray();
    brands.forEach((brand) => {
      if (brand?._id) {
        brandMap[brand._id.toString()] = brand.name;
      }
    });
  }

  const supplierMap: Record<string, string> = {};
  if (supplierObjectIds.length) {
    const suppliersCollection = db.collection("suppliers");
    const suppliers = await suppliersCollection
      .find({ _id: { $in: supplierObjectIds } }, { projection: { name: 1 } })
      .toArray();
    suppliers.forEach((supplier) => {
      if (supplier?._id) {
        supplierMap[supplier._id.toString()] = supplier.name;
      }
    });
  }

  const data = docs.map((d) => {
    const categoryId =
      d.category instanceof ObjectId
        ? d.category.toString()
        : typeof d.category === "string" && ObjectId.isValid(d.category)
        ? d.category
        : undefined;
    const brandId =
      d.brand instanceof ObjectId
        ? d.brand.toString()
        : typeof d.brand === "string" && ObjectId.isValid(d.brand)
        ? d.brand
        : undefined;
    const supplierId =
      d.supplier instanceof ObjectId
        ? d.supplier.toString()
        : typeof d.supplier === "string" && ObjectId.isValid(d.supplier)
        ? d.supplier
        : undefined;

    const categoryName =
      (categoryId && categoryMap[categoryId]
        ? categoryMap[categoryId]
        : undefined) ??
      (typeof d.category === "string" && !ObjectId.isValid(d.category)
        ? d.category
        : undefined);
    const brandName =
      (brandId && brandMap[brandId] ? brandMap[brandId] : undefined) ??
      (typeof d.brand === "string" && !ObjectId.isValid(d.brand)
        ? d.brand
        : undefined);
    const supplierName =
      (supplierId && supplierMap[supplierId]
        ? supplierMap[supplierId]
        : undefined) ??
      (typeof d.supplier === "string" && !ObjectId.isValid(d.supplier)
        ? d.supplier
        : undefined);

    const productIdStr = d._id?.toString();
    const warehouseStock =
      productIdStr && warehouseStockMap[productIdStr]
        ? warehouseStockMap[productIdStr]
        : { "warehouse-1": 0, "warehouse-2": 0 };

    // Calculate total stock from warehouse stocks
    const totalStock = warehouseStock["warehouse-1"] + warehouseStock["warehouse-2"];

    return {
      ...d,
      id: d._id?.toString(),
      _id: undefined,
      categoryId: categoryId ?? undefined,
      brandId: brandId ?? undefined,
      supplierId: supplierId ?? undefined,
      category: categoryName ?? null,
      brand: brandName ?? null,
      supplier: supplierName ?? null,
      warehouseStock,
      pricing: {
        ...d.pricing,
        quantity: totalStock, // Override with calculated total from batches
      },
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
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = productSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid payload",
          issues: parsed.error.flatten((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const db = await getDb();
    const collection = db.collection("products");

    // Best-effort index creation (runs once; subsequent calls are no-ops)
    await Promise.allSettled([
      collection.createIndex({ slug: 1 }, { unique: true, sparse: true }),
      collection.createIndex({ sku: 1 }, { unique: true, sparse: true }),
      collection.createIndex({ name: 1 }),
    ]);

    const now = new Date();

    // Extract warehouse from pricing before storing (warehouse is only used for initial stock batch)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { warehouse, ...pricingWithoutWarehouse } = payload.pricing ?? {};

    const doc = {
      name: payload.name,
      slug: payload.slug,
      sku: payload.sku,
      category: payload.category,
      subCategory: payload.subCategory,
      brand: payload.brand,
      supplier: payload.supplier,
      unit: "Piece", // Default unit
      description: payload.description,
      pricing:
        Object.keys(pricingWithoutWarehouse).length > 0
          ? pricingWithoutWarehouse
          : {
              quantity: 0,
              unit: "Piece",
              qtyAlert: payload.pricing?.qtyAlert,
              price: payload.pricing?.price,
            },
      images: payload.images ?? [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc as Record<string, unknown>);
    const insertedId = result.insertedId;

    // Create initial stock batch if quantity and warehouse are provided
    if (
      payload.pricing?.quantity &&
      payload.pricing.quantity > 0 &&
      payload.pricing.warehouse
    ) {
      const stockBatchesCollection = db.collection("stock_batches");
      const batchDoc = {
        type: "in",
        batchName: `Initial Stock - ${payload.sku}`,
        items: [
          {
            productId: insertedId.toString(),
            name: payload.name,
            sku: payload.sku,
            quantity: payload.pricing.quantity,
            warehouse: payload.pricing.warehouse,
            unit: "Piece",
            unitPrice: payload.pricing.price ?? 0,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      await stockBatchesCollection.insertOne(
        batchDoc as Record<string, unknown>
      );
    }

    return Response.json(
      { insertedId: insertedId.toString() },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
