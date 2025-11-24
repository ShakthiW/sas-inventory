import { z } from "zod";
import { getDb } from "@/lib/db";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

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
      const data = doc
        ? [
            {
              ...doc,
              id: doc._id?.toString(),
              _id: undefined,
            },
          ]
        : [];

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

  const categoryIdStrings = new Set<string>();
  const brandIdStrings = new Set<string>();

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
  });

  const categoryObjectIds = [...categoryIdStrings]
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  const brandObjectIds = [...brandIdStrings]
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const categoryMap: Record<string, string> = {};
  if (categoryObjectIds.length) {
    const categoriesCollection = db.collection("product_categories");
    const categories = await categoriesCollection
      .find(
        { _id: { $in: categoryObjectIds } },
        { projection: { name: 1 } }
      )
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
      .find(
        { _id: { $in: brandObjectIds } },
        { projection: { name: 1 } }
      )
      .toArray();
    brands.forEach((brand) => {
      if (brand?._id) {
        brandMap[brand._id.toString()] = brand.name;
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

    return {
      ...d,
      id: d._id?.toString(),
      _id: undefined,
      categoryId: categoryId ?? undefined,
      brandId: brandId ?? undefined,
      category: categoryName ?? null,
      brand: brandName ?? null,
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
