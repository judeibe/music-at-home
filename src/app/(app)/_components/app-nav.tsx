"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavGroups, mobileNavItems } from "../_lib/navigation";
import { NavIcon } from "./nav-icon";

type AppNavProps = {
  isAuthenticated?: boolean;
};

export function AppNav({ isAuthenticated = false }: AppNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar nav ── */}
      <nav
        aria-label="Primary navigation desktop"
        className="hidden flex-col gap-1 py-2 md:flex"
      >
        {appNavGroups.map((group) => (
          <div key={group.id} className="flex flex-col gap-0.5">
            {group.label ? (
              <p
                className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--fg-tertiary)" }}
              >
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const isAuthItem = item.href === "/auth";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium am-transition"
                  style={{
                    color: isActive ? "var(--accent)" : "var(--foreground)",
                    background: isActive ? "var(--accent-muted)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "var(--bg-overlay-strong)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }
                  }}
                >
                  <NavIcon symbol={item.symbol} className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isAuthItem ? (
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        background: isAuthenticated
                          ? "rgba(52, 199, 89, 0.15)"
                          : "var(--bg-overlay-strong)",
                        color: isAuthenticated ? "#34c759" : "var(--fg-secondary)",
                      }}
                    >
                      {isAuthenticated ? "On" : "Off"}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Mobile bottom tab nav ── */}
      <nav
        aria-label="Primary navigation mobile"
        className="border-t backdrop-blur-md md:hidden"
        style={{
          background: "color-mix(in srgb, var(--bg-sidebar) 92%, transparent)",
          borderColor: "var(--border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-stretch">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium leading-none am-transition"
                style={{
                  color: isActive ? "var(--accent)" : "var(--fg-secondary)",
                }}
              >
                <NavIcon symbol={item.symbol} className="size-[22px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
