"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import {
  executeMusicAssistantCommand,
  MusicAssistantCommandError,
} from "@/lib/music-assistant/browser";
import {
  fetchLibraryItemsForTypes,
  LIBRARY_MEDIA_TYPES,
  type LibraryMediaItem,
  type LibraryMediaType,
} from "@/lib/music-assistant/media-browser";

const PAGE_SIZE = 24;

const browseTabs: Array<{ label: string; value: "all" | LibraryMediaType }> = [
  { label: "All", value: "all" },
  { label: "Tracks", value: "Track" },
  { label: "Albums", value: "Album" },
  { label: "Artists", value: "Artist" },
  { label: "Playlists", value: "Playlist" },
];

const mediaTypeLabel: Record<LibraryMediaType, string> = {
  Track: "Tracks",
  Album: "Albums",
  Artist: "Artists",
  Playlist: "Playlists",
};

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | LibraryMediaType>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);
  const isStale = deferredQuery !== query;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);
  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState<string | null>(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsByType, setItemsByType] = useState<Record<LibraryMediaType, LibraryMediaItem[]>>({
    Track: [],
    Album: [],
    Artist: [],
    Playlist: [],
  });
  const [hasMoreByType, setHasMoreByType] = useState<Record<LibraryMediaType, boolean>>({
    Track: false,
    Album: false,
    Artist: false,
    Playlist: false,
  });

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

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [activeTab, deferredQuery]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setLoadErrorMessage(null);
      try {
        const types = activeTab === "all" ? LIBRARY_MEDIA_TYPES : [activeTab];
        const result = await fetchLibraryItemsForTypes({
          types,
          query: deferredQuery,
          limit,
          offset: 0,
        });
        if (cancelled) {
          return;
        }
        setItemsByType(result.itemsByType);
        setHasMoreByType(result.hasMoreByType);
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error instanceof MusicAssistantCommandError) {
          setLoadErrorMessage(error.message);
        } else {
          setLoadErrorMessage("Unexpected error while loading library.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, deferredQuery, limit]);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggleFavorite = useCallback(async (itemId: string, isFavorited: boolean) => {
    setPendingFavoriteId(itemId);
    setFavoriteErrorMessage(null);

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
  }, []);

  const filteredItems = useMemo(
    () =>
      LIBRARY_MEDIA_TYPES.flatMap((type) =>
        activeTab === "all" || activeTab === type ? itemsByType[type] : [],
      ),
    [activeTab, itemsByType],
  );

  const totalLoaded = useMemo(
    () => LIBRARY_MEDIA_TYPES.reduce((count, type) => count + itemsByType[type].length, 0),
    [itemsByType],
  );

  const hasMore =
    activeTab === "all"
      ? LIBRARY_MEDIA_TYPES.some((type) => hasMoreByType[type])
      : hasMoreByType[activeTab];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setLimit((prev) => prev + PAGE_SIZE);
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  const activeFilterLabel = activeTab === "all" ? "All media types" : `${mediaTypeLabel[activeTab]} only`;

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-foreground/10 bg-background p-5 md:gap-6">
      <header className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Library</h1>
            <p className="text-sm leading-6 text-foreground/70">
              Browse artists, albums, tracks, and playlists with fast local filtering.
            </p>
          </div>
          <div className="rounded-full border border-foreground/15 bg-background px-3 py-1 text-xs uppercase tracking-[0.12em] text-foreground/60">
            {activeFilterLabel}
          </div>
        </div>

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
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {browseTabs.map((tab) => {
            const isActive = activeTab === tab.value;
            const tabCount = tab.value === "all" ? totalLoaded : itemsByType[tab.value].length;
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition sm:w-auto ${
                  isActive
                    ? "border-foreground/35 bg-foreground/10"
                    : "border-foreground/15 text-foreground/70 hover:bg-foreground/5"
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded-full border border-foreground/15 px-1.5 py-0.5 text-[10px] leading-none">
                  {tabCount}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {favoriteErrorMessage || loadErrorMessage ? (
        <div
          className="rounded-2xl border border-foreground/20 bg-foreground/[0.04] p-3"
          role="alert"
        >
          <p className="text-sm text-foreground/80">{favoriteErrorMessage ?? loadErrorMessage}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-xs uppercase tracking-[0.12em] text-foreground/60">
        <p>{filteredItems.length} results</p>
        <p>{isStale || isLoading ? "Updating…" : "Up to date"}</p>
      </div>

      {!isLoading && filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/20 p-4 text-sm text-foreground/70">
          No items match this filter. Try a different tab or search phrase.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const isFavorited = favoriteIdSet.has(item.id);
            const isPending = pendingFavoriteId === item.id;
            return (
              <article
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="text-sm text-foreground/70">{item.subtitle}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground/60">
                    {item.type}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-foreground/10 pt-3">
                  <p className="truncate text-xs uppercase tracking-[0.12em] text-foreground/60">
                    {item.source}
                  </p>
                  <button
                    type="button"
                    aria-label={isFavorited ? `Remove ${item.title} from favorites` : `Add ${item.title} to favorites`}
                    aria-pressed={isFavorited}
                    className="shrink-0 rounded-lg border border-foreground/15 px-3 py-1 text-xs transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={pendingFavoriteId !== null}
                    onClick={() => void toggleFavorite(item.id, isFavorited)}
                  >
                    {isPending ? (isFavorited ? "Removing…" : "Adding…") : (isFavorited ? "♥ Saved" : "♡ Save")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
    </section>
  );
}
