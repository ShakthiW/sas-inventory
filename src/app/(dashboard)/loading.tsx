import AppSidebarSkeleton from "@/components/app-sidebar-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <SidebarProvider>
      <AppSidebarSkeleton />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="hidden h-4 w-px md:block" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex flex-row flex-wrap items-center gap-3 pr-3 md:pr-6">
            <Skeleton className="hidden h-4 w-28 sm:inline" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <Skeleton className="aspect-video rounded-xl" />
            <Skeleton className="aspect-video rounded-xl" />
            <Skeleton className="aspect-video rounded-xl" />
          </div>
          <Skeleton className="min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
