import { z } from "zod";
import { auth } from "@/lib/better-auth/auth";
import { getDb } from "@/lib/db";
import { sendAddedUserCredentialsEmail } from "@/lib/nodemailer";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().min(1), // role slug or name for now
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    // Create user via auth provider (Better Auth)
    const created = await auth.api.signUpEmail({
      body: { email, password, name },
    });

    // Store role mapping in a separate collection (simple approach)
    const db = await getDb();
    const users = db.collection("users_meta");
    await users.updateOne(
      { email },
      {
        $set: {
          email,
          name,
          role,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    // Email credentials to the new user
    await sendAddedUserCredentialsEmail({
      email,
      name,
      password,
      role,
    });

    return Response.json(
      {
        success: true,
        data: { userId: created?.user?.id ?? null, email, name, role },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await getDb();
    // Fetch users from the 'user' collection (better-auth default)
    // If we have a separate 'users_meta' collection, we might want to join or fetch from there.
    // For now, let's assume 'user' collection has the role if we seeded it there.
    // The previous POST implementation wrote to 'users_meta' AND 'user' (via auth.api.signUpEmail).
    // Let's fetch from 'user' collection as it is the source of truth for auth.
    const users = await db.collection("user").find({}).toArray();

    // Map to a clean structure
    const safeUsers = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role || "staff", // Default to staff if missing
      createdAt: u.createdAt,
    }));

    return Response.json({ success: true, data: safeUsers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
