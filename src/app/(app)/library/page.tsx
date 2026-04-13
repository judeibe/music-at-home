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

  const filteredItems = useMemo(
    () =>
      LIBRARY_MEDIA_TYPES.flatMap((type) =>
        activeTab === "all" || activeTab === type ? itemsByType[type] : [],
      ),
    [activeTab, itemsByType],
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          Library
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Browse artists, albums, tracks, and playlists.
        </p>
      </header>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }}
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <input
            id="library-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search library…"
            style={{
              width: "100%",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-lg)",
              padding: "10px 14px 10px 36px",
              fontSize: "15px",
              color: "var(--foreground)",
              outline: "none",
            }}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {browseTabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(tab.value)}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium am-transition"
                style={{
                  background: isActive ? "var(--accent)" : "var(--bg-surface)",
                  color: isActive ? "#ffffff" : "var(--fg-secondary)",
                  border: isActive ? "none" : "1px solid var(--border)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Errors */}
      {favoriteErrorMessage ?? loadErrorMessage ? (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(252,60,68,0.08)",
            border: "1px solid rgba(252,60,68,0.2)",
            color: "var(--accent)",
          }}
          role="alert"
        >
          {favoriteErrorMessage ?? loadErrorMessage}
        </div>
      ) : null}

      {/* Count / status */}
      <div
        className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.08em]"
        style={{ color: "var(--fg-tertiary)" }}
      >
        <span>{filteredItems.length} results</span>
        <span>{isStale || isLoading ? "Updating…" : ""}</span>
      </div>

      {/* Results */}
      {!isLoading && filteredItems.length === 0 ? (
        <p
          className="rounded-2xl px-4 py-8 text-center text-sm"
          style={{
            background: "var(--bg-surface)",
            border: "1px dashed var(--border-medium)",
            color: "var(--fg-secondary)",
          }}
        >
          No items match this filter.
        </p>
      ) : (
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          {filteredItems.map((item, idx) => {
            const isFavorited = favoriteIds.includes(item.id);
            const isPending = pendingFavoriteId === item.id;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
              >
                {/* Artwork placeholder */}
                <div
                  className="shrink-0 rounded-lg"
                  style={{
                    width: 40,
                    height: 40,
                    background: `linear-gradient(135deg, ${
                      item.type === "Track"
                        ? "#fc3c44 0%, #ff8a80"
                        : item.type === "Album"
                          ? "#5856d6 0%, #af52de"
                          : item.type === "Artist"
                            ? "#007aff 0%, #34aadc"
                            : "#34c759 0%, #30d158"
                    } 100%)`,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />

                {/* Labels */}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    {item.title}
                  </p>
                  <p className="truncate text-xs" style={{ color: "var(--fg-secondary)" }}>
                    {item.subtitle}
                  </p>
                </div>

                {/* Type badge */}
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: "var(--bg-elevated)", color: "var(--fg-secondary)" }}
                >
                  {item.type}
                </span>

                {/* Favorite button */}
                <button
                  type="button"
                  aria-label={
                    isFavorited
                      ? `Remove ${item.title} from favorites`
                      : `Add ${item.title} to favorites`
                  }
                  aria-pressed={isFavorited}
                  className="shrink-0 rounded-full p-1.5 am-transition disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    color: isFavorited ? "var(--accent)" : "var(--fg-tertiary)",
                    background: "transparent",
                  }}
                  disabled={pendingFavoriteId !== null}
                  onClick={() => void toggleFavorite(item.id)}
                >
                  {isPending ? (
                    <svg
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      style={{ width: 16, height: 16 }}
                    >
                      <path d="M8 3.5a4.5 4.5 0 1 0 4.292 5.835.75.75 0 0 1 1.431.43A6 6 0 1 1 14 8a.75.75 0 0 1-1.5 0c0-.827-.163-1.614-.457-2.335A4.483 4.483 0 0 0 8 3.5Z" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 16 16"
                      fill={isFavorited ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={isFavorited ? "0" : "1.5"}
                      style={{ width: 16, height: 16 }}
                    >
                      <path d="M3.172 3.172a4 4 0 0 1 5.656 0L8 4l.172-.172a4 4 0 0 1 5.656 5.656L8 15.313l-5.828-5.829a4 4 0 0 1 0-5.656Z" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
    </div>
  );
}
