import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db";

const supplierUpdateSchema = z.object({
  supplierType: z.enum(["individual", "company"]),
  name: z.string().min(1),
  code: z.string().min(1),
  isActive: z.boolean().default(true),
  phone: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonPhone: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return Response.json(
      { error: "Invalid supplier id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("suppliers");
    const doc = await collection.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return Response.json(
        { error: "Supplier not found" },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      id,
      supplierType: doc.supplierType ?? "individual",
      name: doc.name ?? "",
      code: doc.code ?? "",
      isActive: doc.isActive ?? true,
      phone: doc.phone ?? null,
      contactPersonName: doc.contactPersonName ?? null,
      contactPersonPhone: doc.contactPersonPhone ?? null,
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
      { error: "Invalid supplier id" },
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

  const parsed = supplierUpdateSchema.safeParse(json);
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
    const collection = db.collection("suppliers");

    const now = new Date();
    const updatePayload = {
      supplierType: payload.supplierType,
      name: payload.name,
      code: payload.code,
      isActive: payload.isActive ?? true,
      phone:
        payload.phone && payload.phone.trim()
          ? payload.phone.trim()
          : null,
      contactPersonName:
        payload.contactPersonName && payload.contactPersonName.trim()
          ? payload.contactPersonName.trim()
          : null,
      contactPersonPhone:
        payload.contactPersonPhone && payload.contactPersonPhone.trim()
          ? payload.contactPersonPhone.trim()
          : null,
      updatedAt: now,
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return Response.json(
        { error: "Supplier not found" },
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
      { error: "Invalid supplier id" },
      {
        status: 400,
      }
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("suppliers");

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return Response.json(
        { error: "Supplier not found" },
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
