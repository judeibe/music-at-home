import Link from "next/link";
import { appNavItems } from "./_lib/navigation";

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
          <nav aria-label="Primary" className="flex flex-col gap-2">
            {appNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
