"use client";

import { useMemo, Fragment } from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function toTitleCase(segment: string) {
  return segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function DynamicBreadcrumbs() {
  const pathname = usePathname();

  const segments = useMemo(() => {
    const parts = (pathname || "/").split("/").filter(Boolean);
    const filtered = parts[0]?.startsWith("(") ? parts.slice(1) : parts;
    return filtered;
  }, [pathname]);

  const items = useMemo(() => {
    const acc: { href: string; label: string }[] = [];
    let href = "";
    for (const seg of segments) {
      href += `/${seg}`;
      acc.push({ href, label: toTitleCase(seg) });
    }
    return acc;
  }, [segments]);

  if (items.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.slice(0, -1).map((item) => (
          <Fragment key={item.href}>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{items[items.length - 1].label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
