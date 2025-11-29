import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

async function main() {
  // Read .env.local manually to avoid dotenv dependency issues if not installed
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

  if (!uri) {
    console.error("MONGODB_URI not found in .env.local");
    return;
  }

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri);
  await client.connect();
  console.log("Connected.");

  const db = client.db();
  const user = await db.collection("user").findOne({ email: superAdminEmail });

  if (user) {
    console.log("Super Admin found:", user.email, "Role:", user.role);
  } else {
    console.error("Super Admin NOT found in DB");
  }

  await client.close();
}

main().catch(console.error);
