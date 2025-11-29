import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
  if (authInstance) return authInstance;

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;

  if (!db) throw new Error("MongoDB connection not found");

  authInstance = betterAuth({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    database: mongodbAdapter(db as any),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    plugins: [nextCookies()],
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "staff",
        },
      },
    },
  });

  // Seeding Logic
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (superAdminEmail && superAdminPassword) {
    // Check if user exists directly in DB to avoid API issues
    const user = await db.collection("user").findOne({ email: superAdminEmail });

    if (!user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (authInstance.api as any).signUpEmail({
        body: {
          email: superAdminEmail,
          password: superAdminPassword,
          name: "Super Admin",
          role: "super-admin",
        },
      });
      console.log("Super Admin seeded successfully");
    }
  }

  return authInstance;
};

export const auth = await getAuth();
