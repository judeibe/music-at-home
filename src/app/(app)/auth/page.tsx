import Link from "next/link";

import { getIsAuthenticatedFromSessionApi } from "@/app/(app)/_lib/auth-session";
import { AuthSessionPanel } from "./_components/auth-session-panel";

export default async function AuthPage() {
  const isAuthenticated = await getIsAuthenticatedFromSessionApi();

  return (
    <section className="flex flex-col gap-5">
      <header className="rounded-3xl border border-foreground/10 bg-background p-5">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Music Assistant access</h1>
        <p className="mt-2 text-sm leading-6 text-foreground/70">
          Connect this app to your Music Assistant instance, then move directly into playback and
          room control workflows.
        </p>
      </header>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border border-foreground/10 bg-background p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Onboarding checklist</h2>
          <ol className="mt-3 flex flex-col gap-2 text-sm text-foreground/80">
            <li>1. Sign in with your Music Assistant account credentials.</li>
            <li>2. Optionally provide a provider ID if your instance requires it.</li>
            <li>3. Confirm session status updates to “Signed in”.</li>
          </ol>
        </section>

        <section className="rounded-3xl border border-foreground/10 bg-background p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Next actions</h2>
          <p className="mt-2 text-sm text-foreground/70">
            {isAuthenticated
              ? "Your session is active. Jump to operational routes to control playback."
              : "Sign in first, then return to home to view live status and quick controls."}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/"
              className="inline-flex rounded-xl border border-foreground/20 px-3 py-1.5 text-sm font-medium transition hover:bg-foreground/5"
            >
              Open home dashboard
            </Link>
            <Link
              href="/players"
              className="inline-flex rounded-xl border border-foreground/20 px-3 py-1.5 text-sm font-medium transition hover:bg-foreground/5"
            >
              Go to players
            </Link>
          </div>
        </section>
      </div>

      <AuthSessionPanel initialIsAuthenticated={isAuthenticated} />
    </section>
  );
}
