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
    <section className="flex flex-col gap-5 rounded-3xl border border-foreground/10 bg-background p-5 md:gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Search</h1>
        <p className="text-sm leading-6 text-foreground/70">
          Type to instantly search across tracks, albums, artists, and playlists.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
        <label htmlFor="global-search" className="text-xs uppercase tracking-[0.14em] text-foreground/60">
          Search everything
        </label>
        <input
          id="global-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try 'dance', 'Lorde', or 'playlist'"
          className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/30"
        />

        <div className="grid gap-2 rounded-xl border border-foreground/10 bg-background/70 px-3 py-2 text-xs uppercase tracking-[0.12em] text-foreground/60 sm:grid-cols-2">
          <p>{trimmedQuery.length === 0 ? "Ready" : `${totalResults} results`}</p>
          <p className="sm:text-right">{isStale || isLoading ? "Searching…" : "Synced"}</p>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-foreground/20 bg-foreground/[0.04] p-3" role="alert">
          <p className="text-sm text-foreground/80">{errorMessage}</p>
        </div>
      ) : null}

      {trimmedQuery.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/20 p-4 text-sm text-foreground/70">
          Start typing to search your library content.
        </div>
      ) : !isLoading && totalResults === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/20 p-4 text-sm text-foreground/70">
          No matches found for &ldquo;{trimmedQuery}&rdquo;.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <section
              key={group.type}
              className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-3"
            >
              <div className="flex items-center justify-between gap-2 border-b border-foreground/10 pb-2">
                <h2 className="text-xs uppercase tracking-[0.14em] text-foreground/60">{group.type}</h2>
                <span className="rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground/60">
                  {group.items.length}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-foreground/10 bg-background p-3"
                  >
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="text-sm text-foreground/70">{item.subtitle}</p>
                    <p className="mt-auto truncate text-xs uppercase tracking-[0.12em] text-foreground/60">
                      {item.source}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
    </section>
  );
}
