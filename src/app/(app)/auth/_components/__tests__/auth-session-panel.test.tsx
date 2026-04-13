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
      .mockResolvedValueOnce(makeJsonResponse({ success: true }))
      .mockResolvedValueOnce(makeJsonResponse({ success: true, authenticated: true }));

    render(<AuthSessionPanel initialIsAuthenticated={false} />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await screen.findByText("Signed in successfully.");
    expect(screen.getAllByText(/signed in/i).length).toBeGreaterThan(0);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/music-assistant/auth/login",
      expect.objectContaining({
        method: "POST",
      }),
    );
    const loginRequest = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(JSON.parse(loginRequest.body as string)).toEqual({
      username: "admin",
      password: "secret",
    });
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
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await screen.findByText("Bad credentials");
    expect(screen.getAllByText(/signed out/i).length).toBeGreaterThan(0);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("signs out successfully", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(makeJsonResponse({ success: true }))
      .mockResolvedValueOnce(makeJsonResponse({ success: true, authenticated: false }));

    render(<AuthSessionPanel initialIsAuthenticated={true} />);

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await screen.findByText("Signed out successfully.");
    await waitFor(() => {
      expect(screen.getAllByText(/signed out/i).length).toBeGreaterThan(0);
    });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/music-assistant/auth/logout",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });
});
