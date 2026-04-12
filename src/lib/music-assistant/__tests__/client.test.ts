import { describe, expect, it, vi } from "vitest";

import { MusicAssistantApiError } from "../errors";
import { MusicAssistantApiClient } from "../client";

function makeOkResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeErrorResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MusicAssistantApiClient", () => {
  describe("getInfo", () => {
    it("calls GET /info and returns parsed JSON", async () => {
      const payload = {
        schema_version: 1,
        server_version: "1.0.0",
        onboard_done: true,
        homeassistant_addon: false,
      };
      const fetcher = vi.fn().mockResolvedValue(makeOkResponse(payload));
      const client = new MusicAssistantApiClient({
        baseUrl: "http://localhost:8095",
        fetcher,
      });

      const result = await client.getInfo();

      expect(fetcher).toHaveBeenCalledWith(
        "http://localhost:8095/info",
        expect.objectContaining({ method: "GET" }),
      );
      expect(result).toEqual(payload);
    });
  });

  describe("getAuthProviders", () => {
    it("calls GET /auth/providers and returns parsed JSON", async () => {
      const payload = { providers: [{ id: "builtin" }] };
      const fetcher = vi.fn().mockResolvedValue(makeOkResponse(payload));
      const client = new MusicAssistantApiClient({
        baseUrl: "http://localhost:8095",
        fetcher,
      });

      const result = await client.getAuthProviders();

      expect(fetcher).toHaveBeenCalledWith(
        "http://localhost:8095/auth/providers",
        expect.objectContaining({ method: "GET" }),
      );
      expect(result).toEqual(payload);
    });
  });

  describe("login", () => {
    it("calls POST /auth/login with credentials and returns token response", async () => {
      const payload = {
        success: true,
        token: "abc123",
        user: { user_id: "1", username: "admin", role: "admin" },
      };
      const fetcher = vi.fn().mockResolvedValue(makeOkResponse(payload));
      const client = new MusicAssistantApiClient({
        baseUrl: "http://localhost:8095",
        fetcher,
      });

      const result = await client.login({ username: "admin", password: "secret" });

      expect(fetcher).toHaveBeenCalledWith(
        "http://localhost:8095/auth/login",
        expect.objectContaining({ method: "POST" }),
      );
      const body = JSON.parse((fetcher.mock.calls[0][1] as RequestInit).body as string);
      expect(body).toEqual({
        provider_id: "builtin",
        credentials: { username: "admin", password: "secret" },
      });
      expect(result).toEqual(payload);
    });

    it("uses custom providerId when provided", async () => {
      const payload = {
        success: true,
        token: "token",
        user: { user_id: "2", username: "user", role: "user" },
      };
      const fetcher = vi.fn().mockResolvedValue(makeOkResponse(payload));
      const client = new MusicAssistantApiClient({
        baseUrl: "http://localhost:8095",
        fetcher,
      });

      await client.login({ username: "user", password: "pass", providerId: "custom" });

      const body = JSON.parse((fetcher.mock.calls[0][1] as RequestInit).body as string);
      expect(body.provider_id).toBe("custom");
    });
  });

  describe("executeCommand", () => {
    it("throws UNAUTHORIZED when no token is provided", async () => {
      const fetcher = vi.fn();
      const client = new MusicAssistantApiClient({
        baseUrl: "http://localhost:8095",
        fetcher,
      });

      await expect(
        client.executeCommand({ command: "player/get_players" }, {}),
      ).rejects.toThrow(MusicAssistantApiError);

      await expect(
        client.executeCommand({ command: "player/get_players" }, {}),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED", status: 401 });
    });

    it("sends Authorization header and POST body when token is provided", async () => {
      const payload = [{ player_id: "p1" }];
      const fetcher = vi.fn().mockResolvedValue(makeOkResponse(payload));
      const client = new MusicAssistantApiClient({
        baseUrl: "http://localhost:8095",
        fetcher,
      });

      const result = await client.executeCommand(
        { command: "player/get_players", args: { active: true } },
        { token: "mytoken" },
      );

      const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:8095/api");
      expect((init.headers as Headers).get("Authorization")).toBe("Bearer mytoken");
      const body = JSON.parse(init.body as string);
      expect(body).toEqual({ command: "player/get_players", args: { active: true } });
      expect(result).toEqual(payload);
    });
  });

  describe("error handling", () => {
    it("throws MusicAssistantApiError on non-ok response", async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValue(makeErrorResponse({ message: "Bad creds" }, 401));
      const client = new MusicAssistantApiClient({
        baseUrl: "http://localhost:8095",
        fetcher,
      });

      await expect(client.getInfo()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        status: 401,
        message: "Bad creds",
      });
    });

    it("throws NETWORK_ERROR when fetch rejects", async () => {
      const fetcher = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
      const client = new MusicAssistantApiClient({
        baseUrl: "http://localhost:8095",
        fetcher,
      });

      await expect(client.getInfo()).rejects.toMatchObject({
        code: "NETWORK_ERROR",
      });
    });

    it("handles empty response body", async () => {
      const fetcher = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
      const client = new MusicAssistantApiClient({
        baseUrl: "http://localhost:8095",
        fetcher,
      });

      const result = await client.getInfo();
      expect(result).toBeNull();
    });

    it("handles non-JSON response body as raw text", async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValue(new Response("not json", { status: 200 }));
      const client = new MusicAssistantApiClient({
        baseUrl: "http://localhost:8095",
        fetcher,
      });

      const result = await client.getInfo();
      expect(result).toBe("not json");
    });

    it("strips trailing slash from baseUrl", async () => {
      const payload = { schema_version: 1, server_version: "1.0.0" };
      const fetcher = vi.fn().mockResolvedValue(makeOkResponse(payload));
      const client = new MusicAssistantApiClient({
        baseUrl: "http://localhost:8095/",
        fetcher,
      });

      await client.getInfo();
      const [url] = fetcher.mock.calls[0] as [string];
      expect(url).toBe("http://localhost:8095/info");
    });
  });
});
