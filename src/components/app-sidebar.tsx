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
          title: "Inventory",
          url: "/inventory",
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
          title: "Low Stocks",
          url: "/inventory/low-stocks",
        },
        {
          title: "Create Product",
          url: "/inventory/create-product",
          isActive: true,
        },
        {
          title: "Suppliers",
          url: "/inventory/suppliers",
        },
        {
          title: "Product Categories",
          url: "/inventory/product-categories",
        },
        {
          title: "Product Subcategories",
          url: "/inventory/product-subcategories",
        },
        {
          title: "Brands",
          url: "/inventory/brands",
        },
        {
          title: "Units of Measurement",
          url: "/inventory/units-of-measurement",
        },
        {
          title: "Print Barcodes",
          url: "/inventory/print-barcodes",
        },
      ],
    },
    {
      title: "Stocks",
      url: "/stocks",
      items: [
        {
          title: "Manage Stocks",
          url: "/stocks/manage-stocks",
        },
        {
          title: "Add Stock",
          url: "/stocks/add-stock",
        },
        {
          title: "Out Stock",
          url: "/stocks/out-stock",
        },
        {
          title: "Stock Transfers",
          url: "/stocks/stock-transfers",
        },
        {
          title: "History",
          url: "/stocks/history",
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
