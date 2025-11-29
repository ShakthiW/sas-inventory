import { z } from "zod";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.string().min(1).optional(),
  password: z.string().min(6).optional(), // Optional password update
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("user").findOne({ _id: new ObjectId(id) });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || "staff",
    };

    return Response.json({ success: true, data: safeUser });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = await getDb();
    const updateData: any = { ...parsed.data, updatedAt: new Date() };

    // If password is provided, we would need to hash it.
    // For now, let's assume password update is handled separately or we need to import bcrypt.
    // Since we are using better-auth, direct password update might bypass its hashing if we don't use its API.
    // But for now, let's focus on role/name/email.
    if (updateData.password) {
      // TODO: Hash password if we want to support password update here.
      // For safety, let's remove password from direct DB update unless we hash it.
      delete updateData.password;
    }

    const result = await db
      .collection("user")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db
      .collection("user")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
