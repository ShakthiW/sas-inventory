import { AppSidebar } from "@/components/app-sidebar";
// Breadcrumb primitives imported by DynamicBreadcrumbs internally
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DynamicBreadcrumbs from "@/components/DynamicBreadcrumbs";
import { redirect } from "next/navigation";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import UserDropdown from "@/components/UserDropdown";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DynamicBreadcrumbs />
          </div>
          <div className="flex flex-row flex-wrap items-center gap-3 pr-3 md:pr-6">
            <UserDropdown user={user} />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
