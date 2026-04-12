"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  executeMusicAssistantCommand,
  MusicAssistantCommandError,
} from "@/lib/music-assistant/browser";
import {
  libraryItems,
  matchesLibraryQuery,
  type LibraryItemType,
} from "../_lib/library-items";

const browseTabs: Array<{ label: string; value: "all" | LibraryItemType }> = [
  { label: "All", value: "all" },
  { label: "Tracks", value: "Track" },
  { label: "Albums", value: "Album" },
  { label: "Artists", value: "Artist" },
  { label: "Playlists", value: "Playlist" },
];

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | LibraryItemType>("all");
  const deferredQuery = useDeferredValue(query);
  const isStale = deferredQuery !== query;

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);
  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const result = await executeMusicAssistantCommand<string[]>({
          command: "favorites/list",
          args: {},
        });
        setFavoriteIds(Array.isArray(result) ? result : []);
      } catch {
        // Favorites load failure is non-blocking; toggle actions will still surface errors.
      }
    })();
  }, []);

  const toggleFavorite = useCallback(
    async (itemId: string) => {
      setPendingFavoriteId(itemId);
      setFavoriteErrorMessage(null);
      const isFavorited = favoriteIds.includes(itemId);

      try {
        if (isFavorited) {
          await executeMusicAssistantCommand({
            command: "favorites/remove",
            args: { item_id: itemId },
          });
          setFavoriteIds((prev) => prev.filter((id) => id !== itemId));
        } else {
          await executeMusicAssistantCommand({
            command: "favorites/add",
            args: { item_id: itemId },
          });
          setFavoriteIds((prev) => [...prev, itemId]);
        }
      } catch (error) {
        if (error instanceof MusicAssistantCommandError) {
          setFavoriteErrorMessage(error.message);
        } else {
          setFavoriteErrorMessage("Unexpected error while updating favorites.");
        }
      } finally {
        setPendingFavoriteId(null);
      }
    },
    [favoriteIds],
  );

  const filteredItems = useMemo(() => {
    return libraryItems.filter((item) => {
      const tabMatch = activeTab === "all" || item.type === activeTab;
      const queryMatch = matchesLibraryQuery(item, deferredQuery);
      return tabMatch && queryMatch;
    });
  }, [activeTab, deferredQuery]);

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-foreground/10 bg-background p-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Library</h1>
        <p className="text-sm leading-6 text-foreground/70">
          Browse artists, albums, tracks, and playlists with fast local filtering.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <label htmlFor="library-query" className="text-xs uppercase tracking-[0.14em] text-foreground/60">
          Search library
        </label>
        <input
          id="library-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, artist, source, or keyword"
          className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/30"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {browseTabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isActive
                    ? "border-foreground/30 bg-foreground/10"
                    : "border-foreground/15 text-foreground/70 hover:bg-foreground/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {favoriteErrorMessage ? (
        <div
          className="rounded-2xl border border-foreground/20 bg-foreground/[0.04] p-3"
          role="alert"
        >
          <p className="text-sm text-foreground/80">{favoriteErrorMessage}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-foreground/60">
        <p>{filteredItems.length} results</p>
        <p>{isStale ? "Updating…" : "Up to date"}</p>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/20 p-4 text-sm text-foreground/70">
          No items match this filter. Try a different tab or search phrase.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredItems.map((item) => {
            const isFavorited = favoriteIds.includes(item.id);
            const isPending = pendingFavoriteId === item.id;
            return (
              <article
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <span className="shrink-0 rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground/60">
                    {item.type}
                  </span>
                </div>
                <p className="text-sm text-foreground/70">{item.subtitle}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">{item.source}</p>
                  <button
                    type="button"
                    aria-label={isFavorited ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
                    aria-pressed={isFavorited}
                    className="rounded-lg border border-foreground/15 px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={pendingFavoriteId !== null}
                    onClick={() => void toggleFavorite(item.id)}
                  >
                    {isPending ? (isFavorited ? "Removing…" : "Adding…") : (isFavorited ? "♥ Saved" : "♡ Save")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
