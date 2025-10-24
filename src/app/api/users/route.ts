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
