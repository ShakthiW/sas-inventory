"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
};

type NavGroup = {
  title: string;
  url: string;
  items?: NavItem[];
};

export default function SidebarNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  const allItems = React.useMemo(() => {
    return groups.flatMap((group) => group.items ?? []);
  }, [groups]);

  const activeUrl = React.useMemo(() => {
    const matchingItems = allItems.filter((item) => {
      const url = item.url;
      if (pathname === url) return true;
      const prefix = url.endsWith("/") ? url : `${url}/`;
      return pathname.startsWith(prefix);
    });

    if (matchingItems.length === 0) return null;

    return matchingItems.reduce((longest, current) =>
      current.url.length > longest.url.length ? current : longest
    ).url;
  }, [allItems, pathname]);

  return (
    <SidebarMenu>
      {groups.map((group) => (
        <div key={group.title}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          {group.items?.length ? (
            <SidebarMenuSub>
              {group.items.map((sub) => {
                const isActive = sub.url === activeUrl;
                return (
                  <SidebarMenuSubItem key={sub.title}>
                    <SidebarMenuSubButton asChild isActive={isActive}>
                      <Link href={sub.url} className="font-medium">{sub.title}</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          ) : null}
        </div>
      ))}
    </SidebarMenu>
  );
}
