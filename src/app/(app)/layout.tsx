import { AppNav } from "./_components/app-nav";
import { NowPlayingShellCard } from "./_components/now-playing-shell-card";
import { getIsAuthenticatedFromSessionApi } from "./_lib/auth-session";

const APP_NAME = "Music at Home";
const APP_SLUG = "music-at-home";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthenticated = await getIsAuthenticatedFromSessionApi();

  return (
    <div className="min-h-screen bg-surface-1">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-3 pb-32 pt-4 sm:px-5 md:pb-8 md:pt-6">
        <header className="mb-5 flex flex-col gap-2 rounded-3xl border border-border-subtle bg-background/95 p-5 shadow-elevation-1 backdrop-blur md:p-6">
          <p
            aria-hidden="true"
            className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60"
          >
            {APP_SLUG}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{APP_NAME}</h1>
          <p className="max-w-2xl text-sm text-foreground/70">
            A premium control shell for playback, rooms, and library flow across your home audio
            surfaces.
          </p>
        </header>
        <div className="grid flex-1 gap-5 md:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden md:block">
            <div className="sticky top-6 rounded-3xl border border-border-subtle bg-surface-1/80 p-3 shadow-elevation-2 backdrop-blur">
              <AppNav isAuthenticated={isAuthenticated} includeMobile={false} />
            </div>
          </aside>
          <main className="flex min-w-0 flex-col gap-4 rounded-3xl border border-border-subtle bg-background/95 p-4 shadow-elevation-2 md:p-5">
            <NowPlayingShellCard />
            <section className="flex flex-1 flex-col rounded-2xl border border-border-subtle bg-surface-1/70 p-3 md:p-4">
              {children}
            </section>
          </main>
        </div>
        <AppNav isAuthenticated={isAuthenticated} includeDesktop={false} />
      </div>
    </div>
  );
}
