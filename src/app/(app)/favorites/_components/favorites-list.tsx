"use client";

import { useCallback, useEffect, useState } from "react";

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

const TYPE_LABELS: Record<LibraryMediaType, string> = {
  Track: "Track",
  Album: "Album",
  Artist: "Artist",
  Playlist: "Playlist",
};

export function FavoritesList() {
  const [favoriteItems, setFavoriteItems] = useState<LibraryMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchLibraryItemsForTypes({
        types: LIBRARY_MEDIA_TYPES,
        limit: 200,
        offset: 0,
        favorite: true,
      });
      setFavoriteItems(LIBRARY_MEDIA_TYPES.flatMap((type) => result.itemsByType[type]));
    } catch (error) {
      if (error instanceof MusicAssistantCommandError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unexpected error while loading favorites.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = useCallback(async (itemId: string) => {
    setRemovingId(itemId);
    setErrorMessage(null);

    try {
      await executeMusicAssistantCommand({
        command: "favorites/remove",
        args: { item_id: itemId },
      });
      setFavoriteItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      if (error instanceof MusicAssistantCommandError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unexpected error while removing favorite.");
      }
    } finally {
      setRemovingId(null);
    }
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div
          className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-foreground/70">Loading favorites…</p>
        </div>
      );
    }

    if (favoriteItems.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-foreground/20 p-4">
          <p className="text-sm text-foreground/70">
            No favorites yet. Head to the Library to add some.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {favoriteItems.map((item) => {
          const isRemoving = removingId === item.id;
          return (
            <article
              key={item.id}
              className="flex flex-col gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-sm text-foreground/70">{item.subtitle}</p>
                </div>
                <span className="shrink-0 rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground/60">
                  {TYPE_LABELS[item.type]}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">
                  {item.source}
                </p>
                <button
                  type="button"
                  aria-label={`Remove ${item.title} from favorites`}
                  className="rounded-lg border border-foreground/15 px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={removingId !== null}
                  onClick={() => void removeFavorite(item.id)}
                >
                  {isRemoving ? "Removing…" : "Remove"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-foreground/10 bg-background p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Favorites</h1>
          <p className="text-sm text-foreground/70">
            Your saved tracks, albums, artists, and playlists.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading || removingId !== null}
          onClick={() => void loadFavorites()}
        >
          Refresh
        </button>
      </header>

      {errorMessage ? (
        <div
          className="rounded-2xl border border-foreground/20 bg-foreground/[0.04] p-3"
          role="alert"
        >
          <p className="text-sm text-foreground/80">{errorMessage}</p>
        </div>
      ) : null}

      {renderContent()}
    </section>
  );
}
