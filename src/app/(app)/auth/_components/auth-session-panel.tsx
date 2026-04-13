"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthSessionPanelProps = {
  initialIsAuthenticated: boolean;
};

type PendingAction = "login" | "logout" | null;

type ErrorPayload = {
  error?: {
    message?: string;
  };
};

function readErrorMessage(payload: ErrorPayload | null, fallback: string): string {
  return payload?.error?.message ?? fallback;
}

export function AuthSessionPanel({ initialIsAuthenticated }: AuthSessionPanelProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [providerId, setProviderId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isBusy = pendingAction !== null;
  const canSignOut = isAuthenticated && !isBusy;

  async function refreshAuthState(): Promise<boolean> {
    const response = await fetch("/api/music-assistant/auth/session", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const payload = (await response.json().catch(() => null)) as
      | { authenticated?: boolean }
      | null;

    const authenticated = Boolean(payload?.authenticated);
    setIsAuthenticated(authenticated);
    return authenticated;
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("login");
    setErrorMessage(null);
    setStatusMessage(null);

    const requestBody = {
      username,
      password,
      providerId: providerId.trim() || undefined,
    };

    try {
      const response = await fetch("/api/music-assistant/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const payload = (await response.json().catch(() => null)) as ErrorPayload | null;
      if (!response.ok) {
        setErrorMessage(readErrorMessage(payload, "Unable to sign in."));
        setIsAuthenticated(false);
        return;
      }

      const authenticated = await refreshAuthState();
      setStatusMessage(authenticated ? "Signed in successfully." : "Signed in, but no session found.");
      router.refresh();
    } catch {
      setErrorMessage("Network error while signing in.");
      setIsAuthenticated(false);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleLogout() {
    setPendingAction("logout");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/music-assistant/auth/logout", {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      const payload = (await response.json().catch(() => null)) as ErrorPayload | null;
      if (!response.ok) {
        setErrorMessage(readErrorMessage(payload, "Unable to sign out."));
        return;
      }

      const authenticated = await refreshAuthState();
      setStatusMessage(authenticated ? "Signed out request completed." : "Signed out successfully.");
      router.refresh();
    } catch {
      setErrorMessage("Network error while signing out.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-foreground/10 bg-background p-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Authentication</h1>
        <p className="text-sm leading-6 text-foreground/70">
          Sign in to create a Music Assistant session cookie, or sign out to clear it.
        </p>
      </header>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Session status</p>
        <p className="mt-2 text-sm font-medium">{isAuthenticated ? "Signed in" : "Signed out"}</p>
      </div>

      <form className="flex flex-col gap-3" onSubmit={handleLogin}>
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            disabled={isBusy}
            className="rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={isBusy}
            className="rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Provider ID (optional)
          <input
            name="providerId"
            value={providerId}
            onChange={(event) => setProviderId(event.target.value)}
            disabled={isBusy}
            className="rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === "login" ? "Signing in..." : "Sign in"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={!canSignOut}
            className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "logout" ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </form>

      <p aria-live="polite" className="min-h-6 text-sm text-foreground/70">
        {statusMessage}
      </p>
      <p aria-live="assertive" className="min-h-6 text-sm text-red-600">
        {errorMessage}
      </p>
    </section>
  );
}
