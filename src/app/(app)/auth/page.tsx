import Link from "next/link";

import { getIsAuthenticatedFromSessionApi } from "@/app/(app)/_lib/auth-session";
import { AuthSessionPanel } from "./_components/auth-session-panel";

export default async function AuthPage() {
  const isAuthenticated = await getIsAuthenticatedFromSessionApi();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Account
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Connect to your Music Assistant instance to unlock playback and room control.
        </p>
      </header>

      {/* Status banner */}
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: isAuthenticated
            ? "rgba(52, 199, 89, 0.08)"
            : "var(--bg-surface)",
          border: `1px solid ${isAuthenticated ? "rgba(52,199,89,0.2)" : "var(--border)"}`,
        }}
      >
        <div
          className="size-2.5 rounded-full shrink-0"
          style={{ background: isAuthenticated ? "#34c759" : "var(--fg-tertiary)" }}
        />
        <p
          className="text-sm font-medium"
          style={{ color: isAuthenticated ? "#34c759" : "var(--fg-secondary)" }}
        >
          {isAuthenticated ? "Session active" : "Not signed in"}
        </p>
        {isAuthenticated ? (
          <div className="ml-auto flex gap-2">
            <Link
              href="/"
              className="rounded-full px-3 py-1 text-xs font-semibold am-transition"
              style={{ background: "rgba(52,199,89,0.15)", color: "#34c759" }}
            >
              Go to Home
            </Link>
            <Link
              href="/players"
              className="rounded-full px-3 py-1 text-xs font-semibold am-transition"
              style={{ background: "var(--bg-overlay-strong)", color: "var(--foreground)" }}
            >
              Players
            </Link>
          </div>
        ) : null}
      </div>

      {/* Main layout: form + checklist */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <AuthSessionPanel initialIsAuthenticated={isAuthenticated} />

        <div className="flex flex-col gap-4">
          {/* Onboarding steps */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <h2
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--fg-secondary)" }}
            >
              Getting Started
            </h2>
            <ol className="flex flex-col gap-3">
              {[
                "Sign in with your Music Assistant credentials.",
                "Optionally provide a provider ID if required.",
                "Confirm the session status shows Active.",
              ].map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm" style={{ color: "var(--fg-secondary)", paddingTop: 1 }}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Quick links */}
          {isAuthenticated ? (
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <h2
                className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "var(--fg-secondary)" }}
              >
                Jump To
              </h2>
              <div className="flex flex-col gap-2">
                {[
                  { href: "/", label: "Home dashboard" },
                  { href: "/players", label: "Player controls" },
                  { href: "/rooms", label: "Room groups" },
                  { href: "/library", label: "Music library" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium am-transition"
                    style={{
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "var(--bg-overlay-strong)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }}
                  >
                    {link.label}
                    <svg
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
