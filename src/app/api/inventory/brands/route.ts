import { z } from "zod";
import { getDb } from "@/lib/db";
import type { NextRequest } from "next/server";
import type { BrandCreatePayload, BrandDoc, BrandSortField } from "@/lib/types";

const brandSchema: z.ZodType<BrandCreatePayload> = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
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
    (searchParams.get("sort") as BrandSortField | null) || "createdAt";
  const dir =
    (searchParams.get("dir") || "asc").toLowerCase() === "asc" ? 1 : -1;

  const andClauses: Record<string, unknown>[] = [];
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    andClauses.push({ $or: [{ name: regex }, { description: regex }] });
  }
  const filter: Record<string, unknown> = andClauses.length
    ? { $and: andClauses }
    : {};

  const sortSpec: Record<string, 1 | -1> = {};
  sortSpec[sort] = dir as 1 | -1;

  const collection = db.collection("brands");
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
    const parsed = brandSchema.safeParse(json);
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
    const collection = db.collection("brands");

    await Promise.allSettled([
      collection.createIndex({ name: 1 }, { unique: true }),
      collection.createIndex({ isActive: 1 }),
    ]);

    const now = new Date();
    const doc: BrandDoc = {
      name: payload.name,
      description: payload.description ?? "",
      logoUrl: payload.logoUrl ?? "",
      isActive: payload.isActive ?? true,
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
