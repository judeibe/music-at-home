"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavItems } from "../_lib/navigation";

type AppNavProps = {
  isAuthenticated?: boolean;
  includeDesktop?: boolean;
  includeMobile?: boolean;
};

export function AppNav({
  isAuthenticated = false,
  includeDesktop = true,
  includeMobile = true,
}: AppNavProps) {
  const pathname = usePathname();
  const authStatusLabel = isAuthenticated ? "Signed in" : "Signed out";

  return (
    <>
      {includeDesktop ? (
        <nav
          aria-label="Primary navigation desktop"
          className="hidden h-full flex-col gap-3 md:flex"
        >
          <p
            role="status"
            aria-live="polite"
            className="rounded-xl border border-border-subtle bg-background px-3 py-2 text-xs uppercase tracking-[0.16em] text-foreground/65 shadow-elevation-1"
          >
            Session: {authStatusLabel}
          </p>
          <div className="flex flex-1 flex-col gap-1 rounded-2xl border border-border-subtle bg-background p-2 shadow-elevation-1">
            {appNavItems.map((item) => {
              const isActive = pathname === item.href;
              const isAuthRoute = item.href === "/auth";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-xl border px-3 py-2.5 text-left transition ${
                    isActive
                      ? "border-accent/45 bg-accent/10 shadow-elevation-1"
                      : "border-transparent hover:border-border-subtle hover:bg-surface-1"
                  }`}
                >
                  <span aria-hidden="true" className="text-base leading-none text-foreground/80">
                    {item.symbol}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{item.label}</span>
                    <span className="block truncate text-xs text-foreground/65">
                      {item.description}
                    </span>
                  </span>
                  {isAuthRoute ? (
                    <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-foreground/70">
                      {isAuthenticated ? "On" : "Off"}
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${
                        isActive ? "bg-accent" : "bg-foreground/30"
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      {includeMobile ? (
        <nav
          aria-label="Primary navigation mobile"
          className="fixed inset-x-0 bottom-0 z-30 px-2 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2 md:hidden"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-border-subtle bg-background/95 p-2 shadow-elevation-2 backdrop-blur">
            <p
              role="status"
              aria-live="polite"
              className="px-2 text-center text-[10px] uppercase tracking-[0.16em] text-foreground/60"
            >
              Session: {authStatusLabel}
            </p>
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {appNavItems.map((item) => {
                const isActive = pathname === item.href;
                const isAuthRoute = item.href === "/auth";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-w-18 shrink-0 flex-col items-center gap-1 rounded-xl border px-2 py-1.5 text-[11px] leading-none transition ${
                      isActive
                        ? "border-accent/40 bg-accent/10 font-semibold text-foreground"
                        : "border-transparent text-foreground/70 hover:border-border-subtle hover:bg-surface-1"
                    }`}
                  >
                    <span aria-hidden="true" className="text-base leading-none">
                      {item.symbol}
                    </span>
                    <span className="max-w-16 truncate">{item.label}</span>
                    {isAuthRoute ? (
                      <span className="text-[9px] uppercase tracking-[0.08em] text-foreground/60">
                        {isAuthenticated ? "On" : "Off"}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      ) : null}
    </>
  );
}
