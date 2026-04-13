/**
 * Design System — Component Inventory
 *
 * Storybook-style reference for the Apple Music-inspired design system.
 * Lives at /design-system.
 */

import { MediaCard, MediaRow } from "../_components/media-card";

export default function DesignSystemPage() {
  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          Design System
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Component inventory for the Music at Home Apple Music-inspired visual language.
        </p>
      </header>

      {/* ── Color Tokens ── */}
      <section>
        <SectionHeader title="Color Tokens" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <ColorSwatch name="--background" label="Background" />
          <ColorSwatch name="--bg-sidebar" label="Sidebar" />
          <ColorSwatch name="--bg-surface" label="Surface" />
          <ColorSwatch name="--bg-elevated" label="Elevated" />
          <ColorSwatch name="--accent" label="Accent (Red)" isAccent />
          <ColorSwatch name="--foreground" label="Foreground" />
        </div>
      </section>

      {/* ── Typography ── */}
      <section>
        <SectionHeader title="Typography" />
        <div
          className="flex flex-col gap-5 rounded-2xl p-6"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-widest" style={{ color: "var(--fg-tertiary)" }}>
              Display / Page title
            </p>
            <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              Music at Home
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-widest" style={{ color: "var(--fg-tertiary)" }}>
              Section heading
            </p>
            <p className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
              Recently Played
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-widest" style={{ color: "var(--fg-tertiary)" }}>
              Body / Item title
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Bohemian Rhapsody — Queen
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-widest" style={{ color: "var(--fg-tertiary)" }}>
              Secondary / Subtitle
            </p>
            <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
              Queen · A Night at the Opera · 1975
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-widest" style={{ color: "var(--fg-tertiary)" }}>
              Label / Badge
            </p>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--fg-secondary)" }}
            >
              Library · 243 items
            </p>
          </div>
        </div>
      </section>

      {/* ── Buttons ── */}
      <section>
        <SectionHeader title="Buttons" />
        <div
          className="flex flex-col gap-4 rounded-2xl p-6"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <Row label="Primary (accent)">
            <button
              type="button"
              className="rounded-full px-5 py-2 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#ffffff" }}
            >
              Sign In
            </button>
          </Row>
          <Row label="Secondary (ghost)">
            <button
              type="button"
              className="rounded-full px-5 py-2 text-sm font-semibold"
              style={{
                background: "transparent",
                border: "1px solid var(--border-medium)",
                color: "var(--foreground)",
              }}
            >
              Refresh
            </button>
          </Row>
          <Row label="Filled neutral">
            <button
              type="button"
              className="rounded-full px-5 py-2 text-sm font-semibold"
              style={{ background: "var(--bg-elevated)", color: "var(--foreground)" }}
            >
              Sign Out
            </button>
          </Row>
          <Row label="Icon button (circle)">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full"
              style={{ background: "var(--accent)", color: "#ffffff" }}
              aria-label="Play"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
              </svg>
            </button>
          </Row>
          <Row label="Disabled state">
            <button
              type="button"
              className="rounded-full px-5 py-2 text-sm font-semibold opacity-40"
              style={{ background: "var(--accent)", color: "#ffffff" }}
              disabled
            >
              Unavailable
            </button>
          </Row>
        </div>
      </section>

      {/* ── MediaCard component ── */}
      <section>
        <SectionHeader title="MediaCard" description="Square artwork grid cards for albums, artists, playlists." />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MediaCard title="Dark Side of the Moon" subtitle="Pink Floyd" type="album" />
          <MediaCard title="Rumours" subtitle="Fleetwood Mac" type="album" />
          <MediaCard title="Led Zeppelin" subtitle="Artist" type="artist" />
          <MediaCard title="My Playlist" subtitle="24 tracks" type="playlist" />
        </div>
      </section>

      {/* ── MediaRow component ── */}
      <section>
        <SectionHeader title="MediaRow" description="Horizontal list rows for tracks and search results." />
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {[
            { title: "Bohemian Rhapsody", subtitle: "Queen · 5:55", type: "track" as const },
            { title: "Hotel California", subtitle: "Eagles · 6:30", type: "track" as const },
            { title: "Rumours", subtitle: "Fleetwood Mac · 1977", type: "album" as const },
            { title: "A Great Big World", subtitle: "Artist", type: "artist" as const },
          ].map((item, idx) => (
            <div
              key={item.title}
              style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
            >
              <MediaRow title={item.title} subtitle={item.subtitle} type={item.type} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Status / feedback ── */}
      <section>
        <SectionHeader title="Status & Feedback" />
        <div className="flex flex-col gap-3">
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: "rgba(52,199,89,0.08)",
              border: "1px solid rgba(52,199,89,0.2)",
              color: "#34c759",
            }}
          >
            Session active — signed in successfully.
          </div>
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: "rgba(252,60,68,0.08)",
              border: "1px solid rgba(252,60,68,0.2)",
              color: "var(--accent)",
            }}
          >
            Unable to reach Music Assistant — check your connection.
          </div>
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: "var(--bg-surface)",
              border: "1px dashed var(--border-medium)",
              color: "var(--fg-secondary)",
            }}
          >
            No items found. Try a different search.
          </div>
        </div>
      </section>

      {/* ── Stat Cards ── */}
      <section>
        <SectionHeader title="Stat Card" />
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Players Online", value: "4", detail: "8 total" },
            { label: "Active Rooms", value: "2", detail: "3 queues" },
            { label: "Session", value: "Active", detail: "Signed in", accent: true },
          ].map((card) => (
            <div
              key={card.label}
              className="flex flex-col gap-1 rounded-2xl p-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <p
                className="text-[11px] font-medium uppercase tracking-[0.08em]"
                style={{ color: "var(--fg-secondary)" }}
              >
                {card.label}
              </p>
              <p
                className="text-2xl font-bold tracking-tight"
                style={{ color: card.accent ? "var(--accent)" : "var(--foreground)" }}
              >
                {card.value}
              </p>
              <p className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
                {card.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Progress bar ── */}
      <section>
        <SectionHeader title="Progress Bar" description="Used in the Now Playing mini-player." />
        <div
          className="flex flex-col gap-4 rounded-2xl p-6"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {[25, 50, 75].map((pct) => (
            <div key={pct} className="flex flex-col gap-1">
              <div
                className="h-1 w-full overflow-hidden rounded-full"
                style={{ background: "var(--bg-overlay-strong)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: "var(--accent)" }}
                />
              </div>
              <div
                className="flex justify-between text-[10px]"
                style={{ color: "var(--fg-tertiary)" }}
              >
                <span>1:{pct < 50 ? "30" : "45"}</span>
                <span>4:12</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Input ── */}
      <section>
        <SectionHeader title="Input Fields" />
        <div
          className="flex flex-col gap-4 rounded-2xl p-6"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div className="relative">
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }}
              >
                <path
                  fillRule="evenodd"
                  d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search library…"
              readOnly
              style={{
                width: "100%",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-lg)",
                padding: "10px 14px 10px 36px",
                fontSize: "15px",
                color: "var(--foreground)",
                outline: "none",
              }}
            />
          </div>
          <input
            type="text"
            placeholder="Username"
            readOnly
            style={{
              width: "100%",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              fontSize: "15px",
              color: "var(--foreground)",
              outline: "none",
            }}
          />
        </div>
      </section>

      {/* ── Spacing & Radius tokens ── */}
      <section>
        <SectionHeader title="Border Radius" />
        <div className="flex flex-wrap items-end gap-4">
          {[
            { name: "--radius-xs", label: "xs (6px)", size: 32 },
            { name: "--radius-sm", label: "sm (8px)", size: 40 },
            { name: "--radius-md", label: "md (12px)", size: 48 },
            { name: "--radius-lg", label: "lg (16px)", size: 56 },
            { name: "--radius-xl", label: "xl (20px)", size: 64 },
            { name: "--radius-2xl", label: "2xl (24px)", size: 72 },
          ].map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <div
                style={{
                  width: r.size,
                  height: r.size,
                  background: "var(--accent-muted)",
                  border: "2px solid var(--accent)",
                  borderRadius: `var(${r.name})`,
                }}
              />
              <span className="text-[10px]" style={{ color: "var(--fg-secondary)" }}>
                {r.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Helpers ── */

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
        {title}
      </h2>
      {description ? (
        <p className="mt-0.5 text-sm" style={{ color: "var(--fg-secondary)" }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-6">
      <span
        className="w-40 shrink-0 text-xs"
        style={{ color: "var(--fg-secondary)" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function ColorSwatch({ name, label, isAccent = false }: { name: string; label: string; isAccent?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-14 w-full rounded-xl"
        style={{
          background: `var(${name})`,
          border: "1px solid var(--border)",
          boxShadow: isAccent ? "0 4px 12px rgba(252,60,68,0.3)" : "none",
        }}
      />
      <div>
        <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
          {label}
        </p>
        <p className="text-[10px]" style={{ color: "var(--fg-tertiary)", fontFamily: "var(--font-mono)" }}>
          {name}
        </p>
      </div>
    </div>
  );
}
