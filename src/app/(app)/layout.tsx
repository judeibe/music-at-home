import { AppNav } from "./_components/app-nav";
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
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-background px-4 pb-28 pt-4 md:px-6 md:pb-8">
      <header className="mb-4 flex flex-col gap-1">
        <p
          aria-hidden="true"
          className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/60"
        >
          {APP_SLUG}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {APP_NAME}
        </h1>
      </header>
      <div className="grid flex-1 gap-4 md:grid-cols-[260px_1fr]">
        <aside className="hidden rounded-3xl border border-foreground/10 bg-background p-3 md:block">
          <AppNav isAuthenticated={isAuthenticated} />
        </aside>
        <main className="flex flex-col gap-3">
          <section className="rounded-3xl border border-foreground/10 bg-background px-4 py-3">
            <h2 className="text-xs uppercase tracking-[0.16em] text-foreground/60">
              Now Playing
            </h2>
            <p className="text-sm font-medium">No track selected</p>
          </section>
          {children}
        </main>
      </div>
      <AppNav isAuthenticated={isAuthenticated} />
    </div>
  );
}
