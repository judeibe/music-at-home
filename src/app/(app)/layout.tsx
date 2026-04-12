import { AppNav } from "./_components/app-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-xl border border-black/10 bg-background p-4 dark:border-white/15">
        <p className="text-sm text-foreground/70">music-at-home v1 foundation</p>
        <h1 className="text-xl font-semibold tracking-tight">Application Shell</h1>
      </header>
      <div className="grid flex-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-black/10 bg-background p-3 dark:border-white/15">
          <AppNav />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
