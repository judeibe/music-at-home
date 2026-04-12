import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MusicAssistantCommandError, executeMusicAssistantCommand } from "../browser";

function makeOkResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function makeErrorResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("executeMusicAssistantCommand", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to /api/music-assistant/command and returns data on success", async () => {
    const responseData = [{ player_id: "p1", name: "Living Room" }];
    vi.mocked(fetch).mockResolvedValue(
      makeOkResponse({ success: true, data: responseData }),
    );

    const result = await executeMusicAssistantCommand({ command: "player/get_players" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/music-assistant/command",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ command: "player/get_players" });
    expect(result).toEqual(responseData);
  });

  it("passes args in the request body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeOkResponse({ success: true, data: null }),
    );

    await executeMusicAssistantCommand({
      command: "player/volume_set",
      args: { player_id: "p1", volume: 50 },
    });

    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ command: "player/volume_set", args: { player_id: "p1", volume: 50 } });
  });

  it("throws MusicAssistantCommandError on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeErrorResponse({ error: { code: "UNAUTHORIZED", message: "Not logged in" } }, 401),
    );

    await expect(
      executeMusicAssistantCommand({ command: "player/get_players" }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Not logged in",
      status: 401,
    });
  });

  it("throws MusicAssistantCommandError on invalid success payload", async () => {
    vi.mocked(fetch).mockResolvedValue(makeOkResponse({ unexpected: true }));

    await expect(
      executeMusicAssistantCommand({ command: "player/get_players" }),
    ).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("throws NETWORK_ERROR when fetch rejects", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      executeMusicAssistantCommand({ command: "player/get_players" }),
    ).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: 0,
    });
  });

  it("throws TIMEOUT on AbortError", async () => {
    vi.mocked(fetch).mockImplementation(() => {
      const err = new Error("Aborted");
      err.name = "AbortError";
      return Promise.reject(err);
    });

    await expect(
      executeMusicAssistantCommand({ command: "player/get_players" }),
    ).rejects.toMatchObject({
      code: "TIMEOUT",
      status: 408,
    });
  });
});

describe("MusicAssistantCommandError", () => {
  it("stores code, status, and message", () => {
    const err = new MusicAssistantCommandError({
      message: "Timed out",
      code: "TIMEOUT",
      status: 408,
    });

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("MusicAssistantCommandError");
    expect(err.code).toBe("TIMEOUT");
    expect(err.status).toBe(408);
  });

  it("defaults code to UNKNOWN_ERROR when not provided", () => {
    const err = new MusicAssistantCommandError({ message: "Oops", status: 500 });
    expect(err.code).toBe("UNKNOWN_ERROR");
  });
});
