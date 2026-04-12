import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-assistant/server", () => ({
  logoutMusicAssistantSession: vi.fn(),
}));

const { POST } = await import("../route");
const { logoutMusicAssistantSession } = await import("@/lib/music-assistant/server");

describe("POST /api/music-assistant/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("clears the session and returns success", async () => {
    vi.mocked(logoutMusicAssistantSession).mockResolvedValue(undefined);

    const response = await POST();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it("calls logoutMusicAssistantSession", async () => {
    vi.mocked(logoutMusicAssistantSession).mockResolvedValue(undefined);

    await POST();
    expect(logoutMusicAssistantSession).toHaveBeenCalledOnce();
  });
});
