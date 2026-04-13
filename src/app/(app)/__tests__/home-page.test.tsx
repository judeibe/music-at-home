import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "../page";
import { getIsAuthenticatedFromSessionApi } from "@/app/(app)/_lib/auth-session";
import {
  executeAuthenticatedMusicAssistantCommand,
  getMusicAssistantClient,
  withMusicAssistantAuth,
} from "@/lib/music-assistant/server";

vi.mock("@/app/(app)/_lib/auth-session", () => ({
  getIsAuthenticatedFromSessionApi: vi.fn(),
}));

vi.mock("@/lib/music-assistant/server", () => ({
  executeAuthenticatedMusicAssistantCommand: vi.fn(),
  getMusicAssistantClient: vi.fn(),
  withMusicAssistantAuth: vi.fn(),
}));

describe("HomePage route", () => {
  const getInfo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(withMusicAssistantAuth).mockImplementation(async (operation) => operation());
    vi.mocked(getMusicAssistantClient).mockReturnValue({
      getInfo,
    } as unknown as ReturnType<typeof getMusicAssistantClient>);
  });

  it("renders a sign-in prompt when no auth session exists", async () => {
    vi.mocked(getIsAuthenticatedFromSessionApi).mockResolvedValue(false);
    getInfo.mockResolvedValue({
      server_version: "2.3.0",
      schema_version: 1,
      onboard_done: true,
      homeassistant_addon: false,
    });

    render(await HomePage());

    expect(screen.getByRole("heading", { name: "Home dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to auth" })).toHaveAttribute("href", "/auth");
    expect(executeAuthenticatedMusicAssistantCommand).not.toHaveBeenCalled();
  });

  it("renders playback, rooms, and quick actions for authenticated users", async () => {
    vi.mocked(getIsAuthenticatedFromSessionApi).mockResolvedValue(true);
    getInfo.mockResolvedValue({
      server_version: "2.3.0",
      schema_version: 7,
      onboard_done: true,
      homeassistant_addon: false,
    });
    vi.mocked(executeAuthenticatedMusicAssistantCommand).mockImplementation(async ({ command }) => {
      if (command === "players/all") {
        return [
          {
            player_id: "living-room",
            name: "Living Room",
            available: true,
            playback_state: "playing",
            current_media: {
              title: "Running Up That Hill",
              artist: "Kate Bush",
              elapsed_time_last_updated: 1000,
            },
            group_childs: ["kitchen"],
          },
          {
            player_id: "kitchen",
            name: "Kitchen",
            available: true,
            playback_state: "paused",
            current_media: {
              title: "No Surprises",
              artist: "Radiohead",
              elapsed_time_last_updated: 900,
            },
            group_childs: [],
          },
        ];
      }

      if (command === "player_queues/all") {
        return [
          {
            queue_id: "living-room",
            active: true,
            display_name: "Living Room",
            available: true,
            items: 4,
          },
        ];
      }

      return [];
    });

    render(await HomePage());

    expect(screen.getByRole("heading", { name: "Recent playback" })).toBeInTheDocument();
    expect(screen.getByText("Running Up That Hill")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Active rooms" })).toBeInTheDocument();
    expect(screen.getByText("1 active room groups")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Player controls/i })).toHaveAttribute(
      "href",
      "/players",
    );
    expect(screen.getByText("2 total players, 1 queues tracked")).toBeInTheDocument();
  });
});
