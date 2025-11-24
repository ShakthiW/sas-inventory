import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db";

const unitUpdateSchema = z
  .object({
    name: z.string().min(1).min(2),
    shortName: z.string().optional(),
    kind: z.enum(["base", "pack"]),
    isActive: z.boolean(),
    baseUnitId: z.string().optional(),
    unitsPerPack: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (v) =>
      v.kind === "base" ||
      (v.kind === "pack" && !!v.baseUnitId && !!v.unitsPerPack),
    { message: "Pack units require base unit and quantity" }
  );

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return Response.json(
      { error: "Invalid unit id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const units = db.collection("units_of_measure");
    const doc = await units.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return Response.json(
        { error: "Unit not found" },
        {
          status: 404,
        }
      );
    }

    // Fetch base unit name if this is a pack unit
    let baseUnitName: string | null = null;
    if (doc.kind === "pack" && doc.baseUnitId) {
      const baseUnit = await units.findOne({
        _id: doc.baseUnitId,
      });
      baseUnitName = baseUnit?.name ?? null;
    }

    return Response.json({
      id,
      name: doc.name ?? "",
      shortName: doc.shortName ?? null,
      kind: doc.kind === "pack" ? "pack" : "base",
      isActive: doc.isActive ?? true,
      baseUnitId: doc.baseUnitId?.toString() ?? null,
      baseUnitName,
      unitsPerPack: doc.unitsPerPack ?? null,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt.toISOString() : null,
      updatedAt:
        doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return Response.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return Response.json(
      { error: "Invalid unit id" },
      {
        status: 400,
      }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      {
        status: 400,
      }
    );
  }

  const parsed = unitUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid payload",
        issues: parsed.error.flatten((issue) => issue.message),
      },
      {
        status: 400,
      }
    );
  }

  const payload = parsed.data;

  try {
    const db = await getDb();
    const units = db.collection("units_of_measure");

    const now = new Date();
    const trimmedName = payload.name.trim();
    const trimmedShortName = payload.shortName?.trim() ?? "";

    const updatePayload: {
      name: string;
      shortName: string | null;
      kind: "base" | "pack";
      isActive: boolean;
      baseUnitId?: ObjectId | null;
      unitsPerPack?: number | null;
      updatedAt: Date;
    } = {
      name: trimmedName,
      shortName: trimmedShortName || null,
      kind: payload.kind,
      isActive: payload.isActive,
      updatedAt: now,
    };

    if (payload.kind === "pack") {
      if (!payload.baseUnitId || !ObjectId.isValid(payload.baseUnitId)) {
        return Response.json(
          { error: "Invalid base unit id" },
          {
            status: 400,
          }
        );
      }
      updatePayload.baseUnitId = new ObjectId(payload.baseUnitId);
      updatePayload.unitsPerPack = payload.unitsPerPack ?? null;
    } else {
      updatePayload.baseUnitId = null;
      updatePayload.unitsPerPack = null;
    }

    const result = await units.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        { error: "Unit not found" },
        {
          status: 404,
        }
      );
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return Response.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return Response.json(
      { error: "Invalid unit id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("units_of_measure");
    const unitObjectId = new ObjectId(id);

    const existing = await collection.findOne({
      _id: unitObjectId,
    });

    if (!existing) {
      return Response.json(
        { error: "Unit not found" },
        {
          status: 404,
        }
      );
    }

    let removedPackUnitIds: string[] = [];
    if (existing.kind === "base") {
      const packUnits = await collection
        .find<{ _id: ObjectId }>(
          {
            baseUnitId: unitObjectId,
          },
          {
            projection: { _id: 1 },
          }
        )
        .toArray();

      if (packUnits.length) {
        const packIds = packUnits.map((p) => p._id);
        removedPackUnitIds = packIds.map((p) => p.toString());
        await collection.deleteMany({
          _id: { $in: packIds },
        });
      }
    }

    const result = await collection.deleteOne({
      _id: unitObjectId,
    });

    if (result.deletedCount === 0) {
      return Response.json(
        { error: "Unit not found" },
        {
          status: 404,
        }
      );
    }

    return Response.json(
      {
        success: true,
        removedPackUnitIds,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return Response.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
