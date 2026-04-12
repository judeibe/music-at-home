import { describe, expect, it } from "vitest";

import {
  MusicAssistantApiError,
  createMusicAssistantApiError,
  createMusicAssistantNetworkError,
} from "../errors";

describe("MusicAssistantApiError", () => {
  it("stores code, status and message", () => {
    const err = new MusicAssistantApiError({
      code: "UNAUTHORIZED",
      message: "Not allowed",
      status: 401,
    });

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("MusicAssistantApiError");
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.status).toBe(401);
    expect(err.message).toBe("Not allowed");
  });

  it("accepts optional details payload", () => {
    const details = { reason: "expired" };
    const err = new MusicAssistantApiError({
      code: "UNAUTHORIZED",
      message: "Expired",
      details,
    });
    expect(err.details).toBe(details);
  });
});

describe("createMusicAssistantApiError", () => {
  it.each([
    [400, "BAD_REQUEST"],
    [401, "UNAUTHORIZED"],
    [403, "FORBIDDEN"],
    [500, "SERVER_ERROR"],
    [503, "SERVER_ERROR"],
  ] as const)("maps HTTP %i to code %s", (status, expectedCode) => {
    const err = createMusicAssistantApiError({ status });
    expect(err.code).toBe(expectedCode);
    expect(err.status).toBe(status);
  });

  it("maps unexpected 4xx to UNKNOWN_ERROR", () => {
    const err = createMusicAssistantApiError({ status: 418 });
    expect(err.code).toBe("UNKNOWN_ERROR");
  });

  it("extracts message from details.message field", () => {
    const err = createMusicAssistantApiError({
      status: 400,
      details: { message: "Custom error text" },
    });
    expect(err.message).toBe("Custom error text");
  });

  it("extracts message from details.error field", () => {
    const err = createMusicAssistantApiError({
      status: 401,
      details: { error: "token_expired" },
    });
    expect(err.message).toBe("token_expired");
  });

  it("extracts message from details.detail field", () => {
    const err = createMusicAssistantApiError({
      status: 403,
      details: { detail: "Forbidden resource" },
    });
    expect(err.message).toBe("Forbidden resource");
  });

  it("falls back to default message when details has no known field", () => {
    const err = createMusicAssistantApiError({ status: 401, details: {} });
    expect(err.message).toBe("Music Assistant authentication is required.");
  });

  it("falls back to default message when details is a string", () => {
    const err = createMusicAssistantApiError({ status: 400, details: "oops" });
    expect(err.message).toBe("Music Assistant request is invalid.");
  });
});

describe("createMusicAssistantNetworkError", () => {
  it("creates a NETWORK_ERROR with a descriptive message", () => {
    const cause = new TypeError("Failed to fetch");
    const err = createMusicAssistantNetworkError(cause);

    expect(err).toBeInstanceOf(MusicAssistantApiError);
    expect(err.code).toBe("NETWORK_ERROR");
    expect(err.message).toBe("Failed to reach Music Assistant server.");
    expect(err.details).toBe(cause);
  });
});
