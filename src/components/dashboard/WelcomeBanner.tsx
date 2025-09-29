"use client";

import React from "react";
import { Button } from "@/components/ui/button";

type WelcomeBannerProps = {
  adminName?: string;
  subtitle?: string;
  onCompaniesClick?: () => void;
  onPackagesClick?: () => void;
};

export default function WelcomeBanner({
  adminName = "Admin",
  subtitle = "14 New Companies Subscribed Today !!!",
  onCompaniesClick,
  onPackagesClick,
}: WelcomeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl !bg-[linear-gradient(90deg,#F59E0B_0%,#F97316_55%,#EA580C_100%)] !text-white shadow-sm">
      <div className="flex justify-between gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold md:text-2xl">
            Welcome Back, {adminName}
          </h2>
          <p className="mt-1 text-sm/5 text-white/90">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button
            size="lg"
            className="!bg-black !text-white hover:!bg-black/90"
            onClick={onCompaniesClick}
          >
            Companies
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-foreground hover:bg-white/90"
            onClick={onPackagesClick}
          >
            All Packages
          </Button>
        </div>
      </div>
      {/* Corner blobs for subtle depth */}
      <svg
        className="pointer-events-none absolute -top-14 -left-14 h-[180px] w-[180px] opacity-30"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="blobGradientTL" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          fill="url(#blobGradientTL)"
          d="M40.1,-56.5C52.2,-48.7,62.1,-37.5,68.6,-24.4C75,-11.3,78,3.9,74.2,18.2C70.4,32.5,59.9,46,46.5,56.4C33,66.7,16.5,73.8,0.1,73.6C-16.3,73.4,-32.6,65.9,-45.3,55.3C-58,44.6,-67.1,30.7,-71.5,15.4C-75.8,0.1,-75.5,-16.5,-68.7,-30.3C-61.9,-44,-48.6,-54.8,-34.5,-63.1C-20.5,-71.4,-10.2,-77.2,1.2,-78.9C12.6,-80.6,25.2,-78.3,40.1,-56.5Z"
          transform="translate(100 100)"
        />
      </svg>
      <svg
        className="pointer-events-none absolute -bottom-20 -right-20 h-[220px] w-[220px] opacity-30"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="blobGradientBR" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          fill="url(#blobGradientBR)"
          d="M40.1,-56.5C52.2,-48.7,62.1,-37.5,68.6,-24.4C75,-11.3,78,3.9,74.2,18.2C70.4,32.5,59.9,46,46.5,56.4C33,66.7,16.5,73.8,0.1,73.6C-16.3,73.4,-32.6,65.9,-45.3,55.3C-58,44.6,-67.1,30.7,-71.5,15.4C-75.8,0.1,-75.5,-16.5,-68.7,-30.3C-61.9,-44,-48.6,-54.8,-34.5,-63.1C-20.5,-71.4,-10.2,-77.2,1.2,-78.9C12.6,-80.6,25.2,-78.3,40.1,-56.5Z"
          transform="translate(100 100)"
        />
      </svg>
    </div>
  );
}
