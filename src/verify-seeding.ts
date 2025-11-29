import { connectToDatabase } from "@/database/mongoose";

async function main() {
  console.log("Checking Super Admin seeding...");
  
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail) {
    console.error("SUPER_ADMIN_EMAIL not set");
    return;
  }

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) {
    console.error("Database connection failed");
    return;
  }

  const user = await db.collection("user").findOne({ email: superAdminEmail });

  if (user) {
    console.log("Super Admin found:", user.email, "Role:", user.role);
  } else {
    console.error("Super Admin NOT found");
  }
  process.exit(0);
}

main().catch(console.error);
