import { z } from "zod";
import { getDb } from "@/lib/db";
import type { NextRequest } from "next/server";
import type {
  SupplierCreatePayload,
  SupplierDoc,
  SupplierSortField,
} from "@/lib/types";

const supplierSchema: z.ZodType<SupplierCreatePayload> = z.object({
  supplierType: z.enum(["individual", "company"]),
  name: z.string().min(1),
  code: z.string().min(1),
  isActive: z.boolean().default(true),
  phone: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonPhone: z.string().optional(),
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
  const sort =
    (searchParams.get("sort") as SupplierSortField | null) || "createdAt"; // createdAt | name | code
  const dir =
    (searchParams.get("dir") || "desc").toLowerCase() === "asc" ? 1 : -1;

  const andClauses: Record<string, unknown>[] = [];
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    andClauses.push({
      $or: [
        { name: regex },
        { code: regex },
        { phone: regex },
        { contactPersonName: regex },
      ],
    });
  }

  const filter: Record<string, unknown> = andClauses.length
    ? { $and: andClauses }
    : {};

  const sortSpec: Record<string, 1 | -1> = {};
  sortSpec[sort] = dir as 1 | -1;

  const collection = db.collection("suppliers");
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
    const parsed = supplierSchema.safeParse(json);
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
    const collection = db.collection("suppliers");

    await Promise.allSettled([
      collection.createIndex({ code: 1 }, { unique: true }),
      collection.createIndex({ name: 1 }),
      collection.createIndex({ phone: 1 }),
    ]);

    const now = new Date();
    const doc: SupplierDoc = {
      supplierType: payload.supplierType,
      name: payload.name,
      code: payload.code,
      isActive: payload.isActive ?? true,
      phone: payload.phone ?? null,
      contactPersonName: payload.contactPersonName ?? null,
      contactPersonPhone: payload.contactPersonPhone ?? null,
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
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
