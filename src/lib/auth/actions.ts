"use server";

import { getDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, clearSession } from "@/lib/auth/session";
import type { UserDoc, SignInInput, SignUpInput } from "@/lib/types";

// types moved to src/lib/types

export async function signUp(input: SignUpInput) {
  const db = await getDb();
  const users = db.collection<UserDoc>("users");

  const existing = await users.findOne({ email: input.email });
  if (existing) {
    return { ok: false as const, message: "Email is already in use" };
  }

  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  const user: UserDoc = {
    name: input.name,
    email: input.email,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  await users.insertOne(user);
  const inserted = await users.findOne({ email: input.email });
  if (inserted?._id) {
    await createSession({ id: inserted._id.toString(), email: inserted.email });
  }
  return { ok: true as const, message: "Account created" };
}

export async function signIn(input: SignInInput) {
  const db = await getDb();
  const users = db.collection<UserDoc>("users");

  const user = await users.findOne({ email: input.email });
  if (!user) {
    return { ok: false as const, message: "Invalid email or password" };
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    return { ok: false as const, message: "Invalid email or password" };
  }

  await createSession({ id: user._id!.toString(), email: user.email });
  return { ok: true as const, message: "Signed in" };
}

export async function signOut() {
  await clearSession();
  return { ok: true as const };
}
