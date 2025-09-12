import { z } from "zod";
import { getDb } from "@/lib/db";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import type {
  UnitOfMeasureCreatePayload,
  UnitOfMeasureDoc,
  UnitSortField,
} from "@/lib/types";

const unitSchema: z.ZodType<UnitOfMeasureCreatePayload> = z
  .object({
    name: z.string().min(1),
    shortName: z.string().optional(),
    kind: z.enum(["base", "pack"]),
    isActive: z.boolean().default(true),
    baseUnitId: z.string().optional(),
    unitsPerPack: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (v) =>
      v.kind === "base" ||
      (v.kind === "pack" && !!v.baseUnitId && !!v.unitsPerPack),
    { message: "Pack units require baseUnitId and unitsPerPack" }
  );

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
    (searchParams.get("sort") as UnitSortField | null) || "createdAt";
  const dir =
    (searchParams.get("dir") || "asc").toLowerCase() === "asc" ? 1 : -1;

  const andClauses: Record<string, unknown>[] = [];
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    andClauses.push({ $or: [{ name: regex }, { shortName: regex }] });
  }
  const filter: Record<string, unknown> = andClauses.length
    ? { $and: andClauses }
    : {};

  const sortSpec: Record<string, 1 | -1> = {};
  sortSpec[sort] = dir as 1 | -1;

  const collection = db.collection("units_of_measure");
  const total = await collection.countDocuments(filter);
  const pipeline: Record<string, unknown>[] = [
    { $match: filter },
    { $sort: sortSpec },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: "units_of_measure",
        localField: "baseUnitId",
        foreignField: "_id",
        as: "baseUnit",
      },
    },
    {
      $addFields: {
        baseUnitName: { $arrayElemAt: ["$baseUnit.name", 0] },
      },
    },
    { $project: { baseUnit: 0 } },
  ];
  type AggDoc = {
    _id: ObjectId;
    name: string;
    shortName?: string;
    kind: string;
    isActive?: boolean;
    baseUnitId?: ObjectId;
    unitsPerPack?: number;
    baseUnitName?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
  const docs = await collection.aggregate<AggDoc>(pipeline).toArray();
  const data = docs.map((d) => ({
    ...d,
    id: d._id?.toString?.(),
    _id: undefined,
    baseUnitId: d.baseUnitId?.toString?.(),
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
    const parsed = unitSchema.safeParse(json);
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
    const collection = db.collection("units_of_measure");

    await Promise.allSettled([
      collection.createIndex({ name: 1 }, { unique: true }),
      collection.createIndex({ shortName: 1 }, { unique: false, sparse: true }),
      collection.createIndex({ kind: 1 }),
    ]);

    const now = new Date();
    const doc: UnitOfMeasureDoc = {
      name: payload.name,
      shortName: payload.shortName ?? undefined,
      kind: payload.kind,
      isActive: payload.isActive ?? true,
      baseUnitId:
        payload.kind === "pack" && payload.baseUnitId
          ? new ObjectId(payload.baseUnitId)
          : undefined,
      unitsPerPack: payload.kind === "pack" ? payload.unitsPerPack : undefined,
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
