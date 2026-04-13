import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LibraryPage from "../page";
import { executeMusicAssistantCommand } from "@/lib/music-assistant/browser";
import { fetchLibraryItemsForTypes } from "@/lib/music-assistant/media-browser";

vi.mock("@/lib/music-assistant/browser", async () => {
  const actual = await vi.importActual<typeof import("@/lib/music-assistant/browser")>(
    "@/lib/music-assistant/browser",
  );

  return {
    ...actual,
    executeMusicAssistantCommand: vi.fn(),
  };
});

vi.mock("@/lib/music-assistant/media-browser", async () => {
  const actual = await vi.importActual<typeof import("@/lib/music-assistant/media-browser")>(
    "@/lib/music-assistant/media-browser",
  );

  return {
    ...actual,
    fetchLibraryItemsForTypes: vi.fn(),
  };
});

const libraryResponse = {
  itemsByType: {
    Track: [{ id: "track-1", title: "Karma Police", subtitle: "Radiohead", source: "local", type: "Track" }],
    Album: [{ id: "album-1", title: "In Rainbows", subtitle: "Radiohead", source: "local", type: "Album" }],
    Artist: [{ id: "artist-1", title: "Radiohead", subtitle: "Artist", source: "local", type: "Artist" }],
    Playlist: [{ id: "playlist-1", title: "Chill", subtitle: "12 tracks", source: "local", type: "Playlist" }],
  },
  hasMoreByType: {
    Track: false,
    Album: false,
    Artist: false,
    Playlist: false,
  },
} as const;

describe("LibraryPage route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(executeMusicAssistantCommand).mockResolvedValue([]);
    vi.mocked(fetchLibraryItemsForTypes).mockResolvedValue(libraryResponse);
  });

  it("loads and shows library items with tab controls", async () => {
    render(<LibraryPage />);

    expect(screen.getByRole("heading", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search library")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Karma Police")).toBeInTheDocument();
      expect(screen.getByText("In Rainbows")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Tracks/i }));

    await waitFor(() => {
      expect(fetchLibraryItemsForTypes).toHaveBeenLastCalledWith(
        expect.objectContaining({
          types: ["Track"],
        }),
      );
    });
  });

  it("sends favorites add and remove commands", async () => {
    vi.mocked(executeMusicAssistantCommand)
      .mockResolvedValueOnce(["track-1"])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    render(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Remove Karma Police from favorites/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add In Rainbows to favorites/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Remove Karma Police from favorites/i }));
    await waitFor(() => {
      expect(executeMusicAssistantCommand).toHaveBeenCalledWith({
        command: "favorites/remove",
        args: { item_id: "track-1" },
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /Add In Rainbows to favorites/i }));
    await waitFor(() => {
      expect(executeMusicAssistantCommand).toHaveBeenCalledWith({
        command: "favorites/add",
        args: { item_id: "album-1" },
      });
    });
  });
});
