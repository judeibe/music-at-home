"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchLibraryItemsForTypes,
  LIBRARY_MEDIA_TYPES,
  type LibraryMediaItem,
  type LibraryMediaType,
} from "@/lib/music-assistant/media-browser";
import { MusicAssistantCommandError } from "@/lib/music-assistant/browser";

type SearchGroup = {
  type: LibraryMediaType;
  items: LibraryMediaItem[];
};

const PAGE_SIZE = 16;

const searchOrder: LibraryMediaType[] = ["Track", "Album", "Artist", "Playlist"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();
  const isStale = deferredQuery !== query;

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [trimmedQuery]);

  useEffect(() => {
    if (trimmedQuery.length === 0) {
      setItemsByType({
        Track: [],
        Album: [],
        Artist: [],
        Playlist: [],
      });
      setHasMoreByType({
        Track: false,
        Album: false,
        Artist: false,
        Playlist: false,
      });
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await fetchLibraryItemsForTypes({
          types: LIBRARY_MEDIA_TYPES,
          query: trimmedQuery,
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
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Unexpected error while searching library.");
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
  }, [trimmedQuery, limit]);

  const groups = useMemo(() => {
    if (trimmedQuery.length === 0) return [];
    const byType: SearchGroup[] = searchOrder
      .map((type) => ({
        type,
        items: itemsByType[type],
      }))
      .filter((group) => group.items.length > 0);
    return byType;
  }, [itemsByType, trimmedQuery]);

  const totalResults = groups.reduce((count, group) => count + group.items.length, 0);
  const hasMore = LIBRARY_MEDIA_TYPES.some((type) => hasMoreByType[type]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading || trimmedQuery.length === 0) {
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
  }, [hasMore, isLoading, trimmedQuery.length]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          Search
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Find tracks, albums, artists, and playlists.
        </p>
      </header>

      {/* Search input */}
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-y-0 left-4 flex items-center"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ width: 16, height: 16, color: "var(--fg-tertiary)" }}
          >
            <path
              fillRule="evenodd"
              d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <input
          id="global-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Songs, artists, albums…"
          autoFocus
          style={{
            width: "100%",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-xl)",
            padding: "12px 16px 12px 44px",
            fontSize: "16px",
            color: "var(--foreground)",
            outline: "none",
          }}
        />
        {(isStale || isLoading) && trimmedQuery.length > 0 ? (
          <span
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Searching…
          </span>
        ) : null}
      </div>

      {/* Error */}
      {errorMessage ? (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(252,60,68,0.08)",
            border: "1px solid rgba(252,60,68,0.2)",
            color: "var(--accent)",
          }}
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {/* Empty / prompt states */}
      {trimmedQuery.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-2xl px-4 py-12 text-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px dashed var(--border-medium)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ width: 40, height: 40, color: "var(--fg-tertiary)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
            Start typing to search your music library
          </p>
        </div>
      ) : !isLoading && totalResults === 0 ? (
        <p
          className="rounded-2xl px-4 py-8 text-center text-sm"
          style={{
            background: "var(--bg-surface)",
            border: "1px dashed var(--border-medium)",
            color: "var(--fg-secondary)",
          }}
        >
          No matches for &ldquo;{trimmedQuery}&rdquo;.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.type}>
              <h2
                className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "var(--fg-secondary)" }}
              >
                {group.type}s{" "}
                <span style={{ color: "var(--fg-tertiary)", fontWeight: "normal" }}>
                  · {group.items.length}
                </span>
              </h2>
              <div
                className="overflow-hidden rounded-2xl"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                {group.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
                  >
                    <div
                      className="shrink-0 rounded-lg"
                      style={{
                        width: 40,
                        height: 40,
                        background: `linear-gradient(135deg, ${
                          group.type === "Track"
                            ? "#fc3c44 0%, #ff8a80"
                            : group.type === "Album"
                              ? "#5856d6 0%, #af52de"
                              : group.type === "Artist"
                                ? "#007aff 0%, #34aadc"
                                : "#34c759 0%, #30d158"
                        } 100%)`,
                      }}
                      aria-hidden="true"
                    />
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
                    <span
                      className="shrink-0 text-[11px]"
                      style={{ color: "var(--fg-tertiary)" }}
                    >
                      {item.source}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
    </div>
  );
}
