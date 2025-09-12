import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { ObjectId } from "mongodb";
import type { SafeUser } from "@/lib/types";

export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSession();
  if (!session) return null;
  const db = await getDb();
  const users = db.collection<{ _id: ObjectId; name: string; email: string }>(
    "users"
  );
  const user = await users.findOne({ email: session.email });
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}
