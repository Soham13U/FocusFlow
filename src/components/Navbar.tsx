"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {ThemeToggle} from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Timer" },
  { href: "/logs", label: "Logs" },
  { href: "/reports", label: "Reports" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left: App name + nav */}
        <div className="flex items-center gap-4">
          <div className="font-semibold tracking-tight">
            FocusFlow
          </div>

          <nav className="flex gap-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;

              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? "default" : "ghost"}
                  size="sm"
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Right: Theme toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
