"use client";

import React from "react";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = React.useMemo(
    () => [
      "Efficiently manage stock, suppliers, and transactions built for small and medium businesses.",
      "Stay in control with real-time inventory insights and low-stock alerts.",
      "Streamline purchasing and sales to reduce errors and save time.",
    ],
    []
  );
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % messages.length);
    }, 5000);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between bg-foreground text-background p-10">
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-md bg-background/10 inline-flex items-center justify-center">
            <Image src="/logo.svg" alt="logo" width={20} height={20} />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-5xl font-semibold">Standord Inventory</h2>
          <p className="max-w-md text-2xl text-background/80 transition-colors">
            {messages[active]}
          </p>
          <div
            className="flex gap-2"
            role="tablist"
            aria-label="Feature highlights"
          >
            {messages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                className={
                  i === active
                    ? "h-1.5 w-1.5 rounded-full bg-background/90"
                    : "h-1.5 w-1.5 rounded-full bg-background/50 hover:bg-background/70 transition-colors"
                }
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-background/70">
          © 2024 Standord. All rights reserved.
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">{children}</div>
      </section>
    </main>
  );
}
