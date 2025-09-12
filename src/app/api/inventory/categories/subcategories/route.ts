import { z } from "zod";
import { getDb } from "@/lib/db";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import type {
  SubCategoryCreatePayload,
  SubCategoryDoc,
  SubCategorySortField,
} from "@/lib/types";

const subCategorySchema: z.ZodType<SubCategoryCreatePayload> = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  parentCategoryId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const db = await getDb();
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
    200
  );
  const q = (searchParams.get("q") || "").trim();
  const sort =
    (searchParams.get("sort") as SubCategorySortField | null) || "createdAt";
  const dir =
    (searchParams.get("dir") || "asc").toLowerCase() === "asc" ? 1 : -1;
  const parent = (searchParams.get("parent") || "").trim();

  const andClauses: Record<string, unknown>[] = [];
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    andClauses.push({
      $or: [{ name: regex }, { slug: regex }, { description: regex }],
    });
  }
  if (parent) {
    try {
      andClauses.push({ parentCategoryId: new ObjectId(parent) });
    } catch {}
  }
  const filter: Record<string, unknown> = andClauses.length
    ? { $and: andClauses }
    : {};

  const sortSpec: Record<string, 1 | -1> = {};
  sortSpec[sort] = dir as 1 | -1;

  const collection = db.collection("product_subcategories");
  const total = await collection.countDocuments(filter);
  const pipeline: Record<string, unknown>[] = [
    { $match: filter },
    { $sort: sortSpec },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: "product_categories",
        localField: "parentCategoryId",
        foreignField: "_id",
        as: "parent",
      },
    },
    {
      $addFields: {
        parentCategoryName: { $arrayElemAt: ["$parent.name", 0] },
      },
    },
    { $project: { parent: 0 } },
  ];
  const docs = (await collection.aggregate(pipeline).toArray()) as Array<{
    _id?: ObjectId;
    name: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
    parentCategoryId: ObjectId;
    parentCategoryName?: string;
    createdAt?: Date;
  }>;

  const data = docs.map((d) => ({
    ...d,
    id: d._id?.toString(),
    _id: undefined,
    parentCategoryId: d.parentCategoryId?.toString?.(),
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
    const parsed = subCategorySchema.safeParse(json);
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
    const collection = db.collection("product_subcategories");

    await Promise.allSettled([
      collection.createIndex(
        { name: 1, parentCategoryId: 1 },
        { unique: true }
      ),
      collection.createIndex({ parentCategoryId: 1 }),
    ]);

    const now = new Date();
    const doc: SubCategoryDoc = {
      name: payload.name,
      slug: payload.slug || payload.name.toLowerCase().replace(/\s+/g, "-"),
      description: payload.description ?? "",
      isActive: payload.isActive ?? true,
      parentCategoryId: new ObjectId(payload.parentCategoryId),
      createdAt: now,
      updatedAt: now,
    };
    const result = await collection.insertOne(
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
