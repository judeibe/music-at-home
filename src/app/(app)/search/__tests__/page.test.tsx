import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SearchPage from "../page";
import { MusicAssistantCommandError } from "@/lib/music-assistant/browser";
import { fetchLibraryItemsForTypes } from "@/lib/music-assistant/media-browser";

vi.mock("@/lib/music-assistant/media-browser", async () => {
  const actual = await vi.importActual<typeof import("@/lib/music-assistant/media-browser")>(
    "@/lib/music-assistant/media-browser",
  );

  return {
    ...actual,
    fetchLibraryItemsForTypes: vi.fn(),
  };
});

const searchResponse = {
  itemsByType: {
    Track: [{ id: "track-1", title: "Somebody Else", subtitle: "The 1975", source: "spotify", type: "Track" }],
    Album: [{ id: "album-1", title: "Notes", subtitle: "The 1975", source: "spotify", type: "Album" }],
    Artist: [],
    Playlist: [],
  },
  hasMoreByType: {
    Track: false,
    Album: false,
    Artist: false,
    Playlist: false,
  },
} as const;

describe("SearchPage route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchLibraryItemsForTypes).mockResolvedValue(searchResponse);
  });

  it("shows helper copy before searching", () => {
    render(<SearchPage />);

    expect(screen.getByRole("heading", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByText("Start typing to search your library content.")).toBeInTheDocument();
  });

  it("searches and renders grouped results", async () => {
    render(<SearchPage />);

    fireEvent.change(screen.getByLabelText("Search everything"), { target: { value: " 1975 " } });

    await waitFor(() => {
      expect(fetchLibraryItemsForTypes).toHaveBeenCalledWith(
        expect.objectContaining({ query: "1975", limit: 16 }),
      );
      expect(screen.getByText("Somebody Else")).toBeInTheDocument();
      expect(screen.getByText("Notes")).toBeInTheDocument();
    });
  });

  it("shows command error alert when search fails", async () => {
    vi.mocked(fetchLibraryItemsForTypes).mockRejectedValue(
      new MusicAssistantCommandError({ message: "Search failed.", status: 500 }),
    );

    render(<SearchPage />);

    fireEvent.change(screen.getByLabelText("Search everything"), { target: { value: "lorde" } });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Search failed.");
    });
  });
});
