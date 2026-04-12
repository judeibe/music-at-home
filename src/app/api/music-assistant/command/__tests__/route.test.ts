import { describe, expect, it, vi } from "vitest";

import { MusicAssistantApiError } from "@/lib/music-assistant/errors";

vi.mock("@/lib/music-assistant/server", () => ({
  executeAuthenticatedMusicAssistantCommand: vi.fn(),
  withMusicAssistantAuth: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

const { POST } = await import("../route");
const { executeAuthenticatedMusicAssistantCommand } = await import(
  "@/lib/music-assistant/server"
);

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/music-assistant/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeBadJsonRequest(): Request {
  return new Request("http://localhost/api/music-assistant/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad-json",
  });
}

describe("POST /api/music-assistant/command", () => {
  it("returns 400 when body is invalid JSON", async () => {
    const response = await POST(makeBadJsonRequest());
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("returns 400 when command field is missing", async () => {
    const response = await POST(makeRequest({ args: {} }));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("returns 400 when command is an empty string", async () => {
    const response = await POST(makeRequest({ command: "" }));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("returns 400 when args is an array", async () => {
    const response = await POST(makeRequest({ command: "player/get_players", args: [] }));
    expect(response.status).toBe(400);
  });

  it("returns 200 with data on successful command", async () => {
    const data = [{ player_id: "p1", name: "Living Room" }];
    vi.mocked(executeAuthenticatedMusicAssistantCommand).mockResolvedValue(data);

    const response = await POST(makeRequest({ command: "player/get_players" }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(data);
  });

  it("passes command and args to executeAuthenticatedMusicAssistantCommand", async () => {
    vi.mocked(executeAuthenticatedMusicAssistantCommand).mockResolvedValue(null);

    await POST(makeRequest({ command: "player/volume_set", args: { player_id: "p1", volume: 80 } }));

    expect(executeAuthenticatedMusicAssistantCommand).toHaveBeenCalledWith({
      command: "player/volume_set",
      args: { player_id: "p1", volume: 80 },
    });
  });

  it("returns error status when MusicAssistantApiError is thrown", async () => {
    vi.mocked(executeAuthenticatedMusicAssistantCommand).mockRejectedValue(
      new MusicAssistantApiError({
        code: "UNAUTHORIZED",
        message: "Session expired",
        status: 401,
      }),
    );

    const response = await POST(makeRequest({ command: "player/get_players" }));
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.error.message).toBe("Session expired");
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(executeAuthenticatedMusicAssistantCommand).mockRejectedValue(
      new Error("Something went wrong"),
    );

    const response = await POST(makeRequest({ command: "player/get_players" }));
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error.code).toBe("UNKNOWN_ERROR");
  });
});
