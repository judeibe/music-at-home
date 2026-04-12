"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavItems } from "../_lib/navigation";

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <nav aria-label="Primary" className="hidden flex-col gap-2 md:flex">
        {appNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-foreground/10" : "hover:bg-foreground/5"
              }`}
            >
              <span className="text-base leading-none">{item.symbol}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 border-t border-foreground/10 bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto">
          {appNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-w-16 shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[11px] leading-none ${
                  isActive ? "bg-foreground/10 font-semibold" : "text-foreground/70"
                }`}
              >
                <span className="text-base leading-none">{item.symbol}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
