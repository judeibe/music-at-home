import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthSessionPanel } from "../auth-session-panel";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

const { useRouter } = await import("next/navigation");

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("AuthSessionPanel", () => {
  const refresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      refresh,
    } as unknown as ReturnType<typeof useRouter>);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("signs in successfully and updates session status", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeJsonResponse({ success: true, user: { username: "admin" } }))
      .mockResolvedValueOnce(makeJsonResponse({ success: true, authenticated: true }));

    render(<AuthSessionPanel initialIsAuthenticated={false} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await screen.findByText("Signed in successfully.");
    expect(screen.getByText("Signed in")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("shows API error feedback when sign in fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      makeJsonResponse(
        { error: { code: "UNAUTHORIZED", message: "Bad credentials" } },
        401,
      ),
    );

    render(<AuthSessionPanel initialIsAuthenticated={false} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await screen.findByText("Bad credentials");
    expect(screen.getByText("Signed out")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("signs out successfully", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeJsonResponse({ success: true }))
      .mockResolvedValueOnce(makeJsonResponse({ success: true, authenticated: false }));

    render(<AuthSessionPanel initialIsAuthenticated={true} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await screen.findByText("Signed out successfully.");
    await waitFor(() => {
      expect(screen.getByText("Signed out")).toBeInTheDocument();
    });
    expect(refresh).toHaveBeenCalledOnce();
  });
});
