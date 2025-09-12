"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

type ActiveStatusBadgeProps = {
  active?: boolean;
  activeText?: string;
  inactiveText?: string;
};

export default function ActiveStatusBadge({
  active = false,
  activeText = "Active",
  inactiveText = "Inactive",
}: ActiveStatusBadgeProps) {
  if (active) {
    return (
      <Badge className="border-none bg-green-600/10 text-green-700 dark:bg-green-400/10 dark:text-green-400">
        <span className="mr-1 inline-block size-2 rounded-full bg-green-500/80" />
        {activeText}
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="border-none bg-muted/40 text-muted-foreground"
    >
      <span className="mr-1 inline-block size-2 rounded-full bg-muted-foreground/40" />
      {inactiveText}
    </Badge>
  );
}
