import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const envVars: Record<string, string> = {};
  envContent.split("\n").forEach((line) => {
    const firstEquals = line.indexOf("=");
    if (firstEquals !== -1) {
      const key = line.substring(0, firstEquals).trim();
      const value = line.substring(firstEquals + 1).trim().replace(/"/g, "");
      envVars[key] = value;
    }
  });

  const uri = envVars["MONGODB_URI"];
  const superAdminEmail = envVars["SUPER_ADMIN_EMAIL"];
  const superAdminPassword = envVars["SUPER_ADMIN_PASSWORD"];

  if (!uri || !superAdminEmail || !superAdminPassword) {
    console.error("Missing env vars");
    return;
  }

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const collection = db.collection("user");

  const user = await collection.findOne({ email: superAdminEmail });

  if (!user) {
    console.log("Creating Super Admin...");
    const passwordHash = await bcrypt.hash(superAdminPassword, 10);
    const now = new Date();
    
    // Check if we should use 'password' or 'passwordHash' based on existing docs or guess
    // better-auth default is usually 'password' for the hash in the database if using standard adapters
    // But types.ts said passwordHash. I'll insert BOTH to be safe or check if I can find another user.
    // Actually, let's check if there are any users.
    const anyUser = await collection.findOne({});
    let passwordField = "password";
    if (anyUser && "passwordHash" in anyUser) {
      passwordField = "passwordHash";
    }

    await collection.insertOne({
      email: superAdminEmail,
      name: "Super Admin",
      [passwordField]: passwordHash,
      role: "super-admin",
      createdAt: now,
      updatedAt: now,
      emailVerified: true, // better-auth might require this
    });
    console.log(`Super Admin created with field ${passwordField}.`);
    
    // better-auth might also need an 'account' record if using multiple providers, but for email/pass it's usually just user.
    // However, better-auth v1 might separate accounts.
    // Without knowing the exact schema better-auth uses, this is risky.
    // But better-auth usually stores the password hash in the user table for email-password.
  } else {
    console.log("Super Admin already exists.");
    if (user.role !== "super-admin") {
      await collection.updateOne({ _id: user._id }, { $set: { role: "super-admin" } });
      console.log("Updated role to super-admin");
    }
  }

  await client.close();
  process.exit(0);
}

main().catch(console.error);
