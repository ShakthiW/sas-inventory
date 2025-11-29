import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

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

  if (!uri || !superAdminEmail) {
    console.error("Missing env vars");
    return;
  }

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const collection = db.collection("user");

  const result = await collection.deleteOne({ email: superAdminEmail });

  if (result.deletedCount > 0) {
    console.log(`Successfully deleted Super Admin user: ${superAdminEmail}`);
    console.log("Please RESTART your server now. The app will automatically re-seed the user with the correct password hash on startup.");
  } else {
    console.log("Super Admin user not found. Nothing to delete.");
  }

  await client.close();
  process.exit(0);
}

main().catch(console.error);
