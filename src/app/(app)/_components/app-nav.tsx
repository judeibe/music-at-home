"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavItems } from "../_lib/navigation";

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-col gap-2">
      {appNavItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-black/10 dark:bg-white/20"
                : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
