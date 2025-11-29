"use server";

import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";

export const signUpWithEmail = async ({
  email,
  password,
  fullName,
  companyName,
  numEmployees,
  currency,
  phone,
  industry,
}: SignUpFormData) => {
  try {
    const response = await auth.api.signUpEmail({
      body: { email, password, name: fullName },
    });

    if (response) {
      await inngest.send({
        name: "app/user.created",
        data: {
          email,
          name: fullName,
          companyName,
          numEmployees,
          currency,
          phone,
          industry,
        },
      });
    }

    return { success: true, data: response };
  } catch (e) {
    console.log("Sign up failed", e);
    return { success: false, error: "Sign up failed" };
  }
};

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
    const response = await auth.api.signInEmail({ body: { email, password } });

    return { success: true, data: response };
  } catch (e) {
    console.log("Sign in failed", e);
    return { success: false, error: "Sign in failed" };
  }
};

export const signOut = async () => {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (e) {
    console.log("Sign out failed", e);
    return { success: false, error: "Sign out failed" };
  }
};

export const createUser = async (data: SignUpFormData & { role: "admin" | "staff" }) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUser = session?.user;

    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUserRole = (currentUser as any).role || "staff";

    if (currentUserRole === "super-admin") {
      // Super admin can create admin or staff
    } else if (currentUserRole === "admin") {
      if (data.role !== "staff") {
        return { success: false, error: "Admins can only create staff" };
      }
    } else {
      return { success: false, error: "Insufficient permissions" };
    }

    const response = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.fullName,
        role: data.role,
      },
    });

    if (response) {
      // Send welcome email or trigger other workflows
      await inngest.send({
        name: "app/user.created",
        data: {
          email: data.email,
          name: data.fullName,
          companyName: data.companyName,
          numEmployees: data.numEmployees,
          currency: data.currency,
          phone: data.phone,
          industry: data.industry,
        },
      });
    }

    return { success: true, data: response };
  } catch (e) {
    console.log("Create user failed", e);
    return { success: false, error: "Create user failed" };
  }
};
