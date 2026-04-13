import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { executeMusicAssistantCommand } from "@/lib/music-assistant/browser";

import { __resetNowPlayingStateForTests } from "../../_lib/now-playing";
import { NowPlayingShellCard } from "../now-playing-shell-card";

vi.mock("@/lib/music-assistant/browser", () => ({
  executeMusicAssistantCommand: vi.fn(),
  MusicAssistantCommandError: class MusicAssistantCommandError extends Error {
    public readonly code: string;
    public readonly status: number;

    public constructor(params: { message: string; code?: string; status: number }) {
      super(params.message);
      this.name = "MusicAssistantCommandError";
      this.code = params.code ?? "UNKNOWN_ERROR";
      this.status = params.status;
    }
  },
}));

type ScenarioConfig = {
  playbackState: "idle" | "playing" | "paused";
  title: string | null;
  artist?: string | null;
  queueItems: Array<{ id: string; name: string; duration?: number; index: number }>;
  queueCurrentIndex: number | null;
};

function setupCommandMocks(config: ScenarioConfig) {
  let currentIndex = config.queueCurrentIndex;

  vi.mocked(executeMusicAssistantCommand).mockImplementation(async ({ command }) => {
    if (command === "players/all") {
      const currentItem =
        currentIndex !== null && currentIndex >= 0
          ? config.queueItems.find((item) => item.index === currentIndex)
          : null;

      return [
        {
          player_id: "player-1",
          provider: "test",
          name: "Living Room",
          available: true,
          playback_state: config.playbackState,
          supported_features: ["pause", "next_previous"],
          current_media:
            config.title || currentItem
              ? {
                  title: config.title ?? currentItem?.name ?? null,
                  artist: config.artist ?? "Test Artist",
                  duration: currentItem?.duration ?? null,
                  elapsed_time: 60,
                }
              : null,
        },
      ];
    }

    if (command === "player_queues/all") {
      return [
        {
          queue_id: "player-1",
          active: true,
          display_name: "Living Room",
          available: true,
          items: config.queueItems.length,
          current_index: currentIndex,
          elapsed_time: 60,
          state: config.playbackState,
        },
      ];
    }

    if (command === "player_queues/items") {
      return config.queueItems.map((item) => ({
        queue_id: "player-1",
        queue_item_id: item.id,
        name: item.name,
        duration: item.duration ?? null,
        index: item.index,
        available: true,
      }));
    }

    if (command === "players/cmd/next") {
      currentIndex = currentIndex === null ? 0 : Math.min(currentIndex + 1, config.queueItems.length - 1);
      return { success: true };
    }

    return { success: true };
  });
}

describe("NowPlayingShellCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetNowPlayingStateForTests();
  });

  it("renders no-media state with queue empty messaging", async () => {
    setupCommandMocks({
      playbackState: "idle",
      title: null,
      artist: null,
      queueItems: [],
      queueCurrentIndex: null,
    });

    render(<NowPlayingShellCard />);

    await screen.findByText("No track selected");
    expect(screen.getByText("Queue is empty.")).toBeInTheDocument();
  });

  it("renders playing state with queue preview", async () => {
    setupCommandMocks({
      playbackState: "playing",
      title: "Song A",
      artist: "Artist A",
      queueItems: [
        { id: "a", name: "Song A", duration: 220, index: 0 },
        { id: "b", name: "Song B", duration: 205, index: 1 },
        { id: "c", name: "Song C", duration: 200, index: 2 },
      ],
      queueCurrentIndex: 0,
    });

    render(<NowPlayingShellCard />);

    await screen.findByText("Song A");
    expect(screen.getByText("Artist A")).toBeInTheDocument();
    expect(screen.getByText("Song B")).toBeInTheDocument();
  });

  it("renders paused state", async () => {
    setupCommandMocks({
      playbackState: "paused",
      title: "Paused Song",
      artist: "Artist P",
      queueItems: [{ id: "p", name: "Paused Song", duration: 180, index: 0 }],
      queueCurrentIndex: 0,
    });

    render(<NowPlayingShellCard />);

    await screen.findByText("Paused Song");
    expect(screen.getByText("Living Room · paused")).toBeInTheDocument();
  });

  it("runs queue navigation control and refreshes track state", async () => {
    setupCommandMocks({
      playbackState: "playing",
      title: null,
      artist: "Artist N",
      queueItems: [
        { id: "a", name: "Song A", duration: 220, index: 0 },
        { id: "b", name: "Song B", duration: 200, index: 1 },
      ],
      queueCurrentIndex: 0,
    });

    render(<NowPlayingShellCard />);

    await screen.findByText("Song A");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(vi.mocked(executeMusicAssistantCommand)).toHaveBeenCalledWith({
        command: "players/cmd/next",
        args: { player_id: "player-1" },
      });
    });
    await screen.findByText("Song B");
  });
});
