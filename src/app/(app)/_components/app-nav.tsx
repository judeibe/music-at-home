"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavItems } from "../_lib/navigation";

type AppNavProps = {
  isAuthenticated?: boolean;
};

export function AppNav({ isAuthenticated = false }: AppNavProps) {
  const pathname = usePathname();
  const authStatusLabel = isAuthenticated ? "Signed in" : "Signed out";

  return (
    <>
      <nav
        aria-label="Primary navigation desktop"
        className="hidden flex-col gap-2 md:flex"
      >
        <p className="px-3 text-xs uppercase tracking-[0.14em] text-foreground/60">
          Session: {authStatusLabel}
        </p>
        {appNavItems.map((item) => {
          const isActive = pathname === item.href;
          const isAuthRoute = item.href === "/auth";
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-foreground/10" : "hover:bg-foreground/5"
              }`}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {item.symbol}
              </span>
              <span>{item.label}</span>
              {isAuthRoute ? (
                <span className="ml-auto rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-foreground/70">
                  {isAuthenticated ? "On" : "Off"}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <nav
        aria-label="Primary navigation mobile"
        className="fixed inset-x-0 bottom-0 border-t border-foreground/10 bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur md:hidden"
      >
        <p className="pb-2 text-center text-[10px] uppercase tracking-[0.16em] text-foreground/60">
          Session: {authStatusLabel}
        </p>
        <div className="mx-auto flex max-w-3xl items-center gap-1 overflow-x-auto">
          {appNavItems.map((item) => {
            const isActive = pathname === item.href;
            const isAuthRoute = item.href === "/auth";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-w-16 shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[11px] leading-none ${
                  isActive ? "bg-foreground/10 font-semibold" : "text-foreground/70"
                }`}
              >
                <span aria-hidden="true" className="text-base leading-none">
                  {item.symbol}
                </span>
                <span className="truncate">{item.label}</span>
                {isAuthRoute ? (
                  <span className="text-[9px] uppercase tracking-[0.08em] text-foreground/60">
                    {isAuthenticated ? "On" : "Off"}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
