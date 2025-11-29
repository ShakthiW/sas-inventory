import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type Role = "super-admin" | "admin" | "staff";

export const getUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return undefined;
  return session.user as typeof session.user & { role: Role };
};

export const requireRole = async (allowedRoles: Role[]) => {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard"); // Or a 403 page
  }

  return user;
};

export const canCreateRole = (currentUserRole: Role, targetRole: Role) => {
  if (currentUserRole === "super-admin") {
    return true; // Super admin can create any role
  }

  if (currentUserRole === "admin") {
    return targetRole === "staff"; // Admin can only create staff
  }

  return false; // Staff cannot create users
};
