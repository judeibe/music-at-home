import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-assistant/session", () => ({
  getMusicAssistantSessionToken: vi.fn(),
}));

const { GET } = await import("../route");
const { getMusicAssistantSessionToken } = await import("@/lib/music-assistant/session");

describe("GET /api/music-assistant/auth/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns authenticated true when token exists", async () => {
    vi.mocked(getMusicAssistantSessionToken).mockResolvedValue("token");

    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.authenticated).toBe(true);
  });

  it("returns authenticated false when token is missing", async () => {
    vi.mocked(getMusicAssistantSessionToken).mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.authenticated).toBe(false);
  });
});
