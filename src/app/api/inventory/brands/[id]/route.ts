import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db";

const brandUpdateSchema = z.object({
  name: z.string().min(1).min(2),
  description: z.string().optional(),
  logoUrl: z.union([z.string().url(), z.literal("")]).optional(),
  isActive: z.boolean().default(true),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return Response.json(
      { error: "Invalid brand id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("brands");
    const doc = await collection.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return Response.json(
        { error: "Brand not found" },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      id,
      name: doc.name ?? "",
      description: doc.description ?? null,
      logoUrl: doc.logoUrl ?? null,
      isActive: doc.isActive ?? true,
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
      { error: "Invalid brand id" },
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

  const parsed = brandUpdateSchema.safeParse(json);
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
    const collection = db.collection("brands");

    const now = new Date();
    const updatePayload = {
      name: payload.name,
      description:
        payload.description && payload.description.trim()
          ? payload.description.trim()
          : null,
      logoUrl:
        payload.logoUrl && payload.logoUrl.trim()
          ? payload.logoUrl.trim()
          : null,
      isActive: payload.isActive ?? true,
      updatedAt: now,
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        { error: "Brand not found" },
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
      { error: "Invalid brand id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("brands");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return Response.json(
        { error: "Brand not found" },
        {
          status: 404,
        }
      );
    }

    return Response.json(
      {
        success: true,
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
