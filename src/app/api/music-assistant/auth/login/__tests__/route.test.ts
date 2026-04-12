import { describe, expect, it, vi } from "vitest";

import { MusicAssistantApiError } from "@/lib/music-assistant/errors";

vi.mock("@/lib/music-assistant/server", () => ({
  loginMusicAssistantSession: vi.fn(),
  withMusicAssistantAuth: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

// Import after mock registration so the mock is applied
const { POST } = await import("../route");
const { loginMusicAssistantSession } = await import("@/lib/music-assistant/server");

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/music-assistant/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeBadJsonRequest(): Request {
  return new Request("http://localhost/api/music-assistant/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json{",
  });
}

describe("POST /api/music-assistant/auth/login", () => {
  it("returns 400 when body is invalid JSON", async () => {
    const response = await POST(makeBadJsonRequest());
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("returns 400 when username is missing", async () => {
    const response = await POST(makeRequest({ password: "secret" }));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("returns 400 when password is missing", async () => {
    const response = await POST(makeRequest({ username: "admin" }));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("returns 400 when body is empty object", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("returns 200 with user on successful login", async () => {
    const fakeUser = { user_id: "1", username: "admin", role: "admin" };
    vi.mocked(loginMusicAssistantSession).mockResolvedValue(fakeUser);

    const response = await POST(makeRequest({ username: "admin", password: "secret" }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.user).toEqual(fakeUser);
  });

  it("calls loginMusicAssistantSession with correct params", async () => {
    const fakeUser = { user_id: "1", username: "admin", role: "admin" };
    vi.mocked(loginMusicAssistantSession).mockResolvedValue(fakeUser);

    await POST(makeRequest({ username: "admin", password: "secret", providerId: "custom" }));

    expect(loginMusicAssistantSession).toHaveBeenCalledWith({
      username: "admin",
      password: "secret",
      providerId: "custom",
    });
  });

  it("returns error status when MusicAssistantApiError is thrown", async () => {
    vi.mocked(loginMusicAssistantSession).mockRejectedValue(
      new MusicAssistantApiError({ code: "UNAUTHORIZED", message: "Bad credentials", status: 401 }),
    );

    const response = await POST(makeRequest({ username: "admin", password: "wrong" }));
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.error.message).toBe("Bad credentials");
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(loginMusicAssistantSession).mockRejectedValue(new Error("Unexpected"));

    const response = await POST(makeRequest({ username: "admin", password: "secret" }));
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error.code).toBe("UNKNOWN_ERROR");
  });
});
