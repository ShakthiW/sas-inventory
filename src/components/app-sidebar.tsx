import { GalleryVerticalEnd } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import SidebarNav from "./sidebar-nav.client";

const data = {
  navMain: [
    {
      title: "General",
      url: "/dashboard",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
        },
        {
          title: "Reports",
          url: "/reports",
        },
      ],
    },
    {
      title: "Inventory",
      url: "/inventory",
      items: [
        {
          title: "Products",
          url: "/inventory/products",
        },
        {
          title: "Suppliers",
          url: "/inventory/suppliers",
        },
        {
          title: "Categories",
          url: "/inventory/categories",
        },
      ],
    },
    {
      title: "Stocks",
      url: "/stocks",
      items: [
        {
          title: "Stock Management",
          url: "/stocks",
        },
        {
          title: "Stock Transfers",
          url: "/stocks/stock-transfers",
        },
          {
          title: "Print Barcodes",
          url: "/stocks/print-barcodes",
        },
      ],
    },
    {
      title: "Manage Users",
      url: "/manage-users",
      items: [
        {
          title: "All Users",
          url: "/manage-users",
        },
        {
          title: "Add/Edit Users",
          url: "/manage-users/add-edit-users",
        },
        {
          title: "Manage Roles",
          url: "/manage-users/manage-roles",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Standord Inventory</span>
                  <span className="">v0.0.1</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {/* Client subcomponent handles active highlighting */}
          <SidebarNav groups={data.navMain} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
