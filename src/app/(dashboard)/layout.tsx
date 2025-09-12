import { AppSidebar } from "@/components/app-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Breadcrumb primitives imported by DynamicBreadcrumbs internally
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth/user";
import DynamicBreadcrumbs from "@/components/DynamicBreadcrumbs";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DynamicBreadcrumbs />
          </div>
          <div className="flex flex-row flex-wrap items-center gap-3 pr-3 md:pr-6">
            {user ? (
              <span className="hidden sm:inline text-sm text-muted-foreground">
                Hi, {user.name || user.email}
              </span>
            ) : null}
            <Avatar className="rounded-full">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
