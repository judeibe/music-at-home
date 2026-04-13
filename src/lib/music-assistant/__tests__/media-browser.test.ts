import { describe, expect, it, vi } from "vitest";

import {
  fetchLibraryItemsForTypes,
  fetchLibraryItemsPage,
  normalizeLibraryMediaItem,
} from "../media-browser";

const executeMusicAssistantCommandMock = vi.fn();

vi.mock("../browser", () => ({
  executeMusicAssistantCommand: (request: unknown) =>
    executeMusicAssistantCommandMock(request),
}));

describe("normalizeLibraryMediaItem", () => {
  it("maps a track payload into UI item fields", () => {
    const item = normalizeLibraryMediaItem("Track", {
      item_id: 42,
      name: "Midnight City",
      artists: [{ name: "M83" }],
      album: { name: "Hurry Up, We're Dreaming" },
      provider: "library",
    });

    expect(item).toEqual({
      id: "42",
      title: "Midnight City",
      subtitle: "M83 · Hurry Up, We're Dreaming",
      type: "Track",
      source: "library",
    });
  });

  it("returns null for invalid payload", () => {
    expect(normalizeLibraryMediaItem("Album", { name: "Missing id" })).toBeNull();
  });
});

describe("fetchLibraryItemsPage", () => {
  it("executes the correct command with search/limit/offset and normalizes results", async () => {
    executeMusicAssistantCommandMock.mockResolvedValueOnce([
      {
        item_id: "album-1",
        name: "Discovery",
        artists: [{ name: "Daft Punk" }],
        year: 2001,
        provider: "library",
      },
    ]);

    const result = await fetchLibraryItemsPage({
      type: "Album",
      query: "daft punk",
      limit: 10,
      offset: 20,
    });

    expect(executeMusicAssistantCommandMock).toHaveBeenCalledWith({
      command: "music/albums/library_items",
      args: {
        limit: 10,
        offset: 20,
        search: "daft punk",
      },
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: "album-1",
      title: "Discovery",
      type: "Album",
    });
    expect(result.hasMore).toBe(false);
  });
});

describe("fetchLibraryItemsForTypes", () => {
  it("fetches requested types and returns grouped items/hasMore flags", async () => {
    executeMusicAssistantCommandMock
      .mockResolvedValueOnce([{ item_id: "t1", name: "Track One", provider: "library" }])
      .mockResolvedValueOnce([]);

    const result = await fetchLibraryItemsForTypes({
      types: ["Track", "Playlist"],
      query: "test",
      limit: 1,
      offset: 0,
    });

    expect(result.itemsByType.Track).toHaveLength(1);
    expect(result.itemsByType.Playlist).toHaveLength(0);
    expect(result.itemsByType.Album).toHaveLength(0);
    expect(result.hasMoreByType.Track).toBe(true);
    expect(result.hasMoreByType.Playlist).toBe(false);
  });
});
