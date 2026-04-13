import { AppNav } from "./_components/app-nav";
import { NowPlayingBar } from "./_components/now-playing-bar";
import { NowPlayingShellCard } from "./_components/now-playing-shell-card";
import { getIsAuthenticatedFromSessionApi } from "./_lib/auth-session";

const APP_NAME = "Music at Home";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthenticated = await getIsAuthenticatedFromSessionApi();

  return (
    <>
      {/* ── Desktop layout (md+): fixed-height two-column ── */}
      <div
        className="hidden md:flex"
        style={{ height: "100dvh", overflow: "hidden" }}
      >
        {/* Sidebar */}
        <aside
          className="am-sidebar flex shrink-0 flex-col"
          style={{ width: "var(--sidebar-width)" }}
        >
          {/* App name */}
          <div className="px-5 pb-3 pt-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--accent)" }}
            >
              {APP_NAME}
            </p>
          </div>

          {/* Navigation — scrollable */}
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            <AppNav isAuthenticated={isAuthenticated} />
          </div>

          {/* Now playing — sidebar footer */}
          <div
            className="shrink-0 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <NowPlayingShellCard compact />
          </div>
        </aside>

        {/* Main content — scrollable */}
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile layout (<md): standard scroll ── */}
      <div
        className="flex flex-col md:hidden"
        style={{
          minHeight: "100dvh",
          paddingBottom:
            "calc(var(--now-playing-height) + var(--mobile-nav-height) + env(safe-area-inset-bottom))",
        }}
      >
        <header
          className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md"
          style={{
            background: "color-mix(in srgb, var(--background) 85%, transparent)",
            borderColor: "var(--border)",
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--accent)" }}
          >
            {APP_NAME}
          </p>
        </header>

        <main className="flex-1 px-4 py-4">
          {children}
        </main>
      </div>

      {/* ── Mobile fixed bottom: now-playing bar + tab nav ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        <NowPlayingBar />
        <AppNav isAuthenticated={isAuthenticated} />
      </div>
    </>
  );
}
