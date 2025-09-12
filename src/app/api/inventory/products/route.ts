import { z } from "zod";
import { getDb } from "@/lib/db";
import type { NextRequest } from "next/server";

// Zod schema mirroring our frontend forms
const productTypeEnum = z
  .enum(["single-product", "variable-product", "bundle-product"]) // keep in sync with ProductType
  .optional();

const pricingSchema = z
  .object({
    productType: productTypeEnum,
    quantity: z.coerce.number().min(0).optional(),
    unit: z.string().optional(),
    qtyAlert: z.coerce.number().min(0).optional(),
    price: z.coerce.number().min(0).optional(),
  })
  .optional();

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  pricing: pricingSchema,
  images: z.array(z.string()).optional(), // image URLs or paths if provided later
});

export async function GET(request: NextRequest) {
  const db = await getDb();

  const searchParams = request.nextUrl.searchParams;
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

  const collection = db.collection("products");
  const total = await collection.countDocuments(filter);
  const docs = await collection
    .find(filter)
    .sort(sortSpec)
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  const data = docs.map((d) => ({
    ...d,
    id: d._id?.toString(),
    _id: undefined,
  }));

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
    const doc = {
      name: payload.name,
      slug: payload.slug,
      sku: payload.sku,
      category: payload.category,
      subCategory: payload.subCategory,
      brand: payload.brand,
      unit: payload.unit,
      description: payload.description,
      pricing: payload.pricing ?? {},
      images: payload.images ?? [],
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(doc as Record<string, unknown>);
    return Response.json(
      { insertedId: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
