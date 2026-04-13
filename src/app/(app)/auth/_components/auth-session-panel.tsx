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

async function readJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

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
    const payload = await readJson<{ authenticated?: boolean }>(response);
    const authenticated = Boolean(payload?.authenticated);
    setIsAuthenticated(authenticated);
    return authenticated;
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("login");
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/music-assistant/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          username,
          password,
          providerId: providerId === "" ? undefined : providerId,
        }),
      });

      const payload = await readJson<ErrorPayload>(response);
      if (!response.ok) {
        setErrorMessage(readErrorMessage(payload, "Unable to sign in."));
        return;
      }

      const authenticated = await refreshAuthState();
      setStatusMessage(
        authenticated
          ? "Signed in successfully."
          : "Sign-in completed but session was not established. Try again.",
      );
      router.refresh();
    } catch {
      setErrorMessage("Network error while signing in.");
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

      const payload = await readJson<ErrorPayload>(response);
      if (!response.ok) {
        setErrorMessage(readErrorMessage(payload, "Unable to sign out."));
        return;
      }

      const authenticated = await refreshAuthState();
      setStatusMessage(
        authenticated
          ? "Sign-out sent but session is still active. Try again."
          : "Signed out successfully.",
      );
      router.refresh();
    } catch {
      setErrorMessage("Network error while signing out.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div
      className="flex flex-col gap-5 rounded-2xl p-5"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Sign In
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
            Create a Music Assistant session to control playback.
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            background: isAuthenticated ? "rgba(52,199,89,0.12)" : "var(--bg-elevated)",
            color: isAuthenticated ? "#34c759" : "var(--fg-secondary)",
          }}
        >
          {isAuthenticated ? "Signed in" : "Signed out"}
        </span>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleLogin}>
        <FieldLabel label="Username">
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            disabled={isBusy}
            placeholder="Enter username"
            className="am-input"
            style={inputStyle}
          />
        </FieldLabel>

        <FieldLabel label="Password">
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={isBusy}
            placeholder="Enter password"
            className="am-input"
            style={inputStyle}
          />
        </FieldLabel>

        <FieldLabel label="Provider ID" hint="optional">
          <input
            name="providerId"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            disabled={isBusy}
            placeholder="Leave blank if not required"
            className="am-input"
            style={inputStyle}
          />
        </FieldLabel>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-full px-5 py-2 text-sm font-semibold am-transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "var(--accent)", color: "#ffffff" }}
          >
            {pendingAction === "login" ? "Signing in…" : "Sign In"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={!canSignOut}
            className="rounded-full px-5 py-2 text-sm font-semibold am-transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: "var(--bg-overlay-strong)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            {pendingAction === "logout" ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </form>

      {statusMessage ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-xl px-3 py-2 text-sm"
          style={{
            background: "rgba(52,199,89,0.08)",
            border: "1px solid rgba(52,199,89,0.2)",
            color: "#34c759",
          }}
        >
          {statusMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-xl px-3 py-2 text-sm"
          style={{
            background: "rgba(252,60,68,0.08)",
            border: "1px solid rgba(252,60,68,0.2)",
            color: "var(--accent)",
          }}
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

/* ── Helpers ── */

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-elevated)",
  border: "1px solid var(--border-medium)",
  borderRadius: "var(--radius-md)",
  padding: "10px 14px",
  fontSize: "15px",
  color: "var(--foreground)",
  outline: "none",
  transition: "border-color 150ms ease, box-shadow 150ms ease",
};

function FieldLabel({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5">
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          {label}
        </span>
        {hint ? (
          <span className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
            {hint}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
