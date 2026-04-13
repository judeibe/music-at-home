import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthPage from "../auth/page";
import { getIsAuthenticatedFromSessionApi } from "@/app/(app)/_lib/auth-session";

vi.mock("@/app/(app)/_lib/auth-session", () => ({
  getIsAuthenticatedFromSessionApi: vi.fn(),
}));

vi.mock("@/app/(app)/auth/_components/auth-session-panel", () => ({
  AuthSessionPanel: ({ initialIsAuthenticated }: { initialIsAuthenticated: boolean }) => (
    <div data-testid="auth-session-panel">
      Auth panel state: {initialIsAuthenticated ? "signed-in" : "signed-out"}
    </div>
  ),
}));

describe("AuthPage route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders onboarding copy and passes auth state to the session panel", async () => {
    vi.mocked(getIsAuthenticatedFromSessionApi).mockResolvedValue(true);

    render(await AuthPage());

    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Getting Started" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Home" })).toHaveAttribute("href", "/");
    expect(screen.getByTestId("auth-session-panel")).toHaveTextContent("signed-in");
  });
});
