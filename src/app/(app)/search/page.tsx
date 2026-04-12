"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  libraryItems,
  matchesLibraryQuery,
  type LibraryItemType,
} from "../_lib/library-items";

type SearchGroup = {
  type: LibraryItemType;
  items: typeof libraryItems;
};

const searchOrder: LibraryItemType[] = ["Track", "Album", "Artist", "Playlist"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();
  const isStale = deferredQuery !== query;

  const groups = useMemo(() => {
    const filtered = libraryItems.filter((item) => matchesLibraryQuery(item, deferredQuery));
    const byType = searchOrder
      .map((type) => ({
        type,
        items: filtered.filter((item) => item.type === type),
      }))
      .filter((group) => group.items.length > 0) satisfies SearchGroup[];
    return byType;
  }, [deferredQuery]);

  const totalResults = groups.reduce((count, group) => count + group.items.length, 0);

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-foreground/10 bg-background p-5">
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
          placeholder="Try “dance”, “lorde”, or “playlist”"
          className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/30"
        />
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-foreground/60">
          <p>{trimmedQuery.length === 0 ? "Ready" : `${totalResults} results`}</p>
          <p>{isStale ? "Searching…" : "Synced"}</p>
        </div>
      </div>

      {trimmedQuery.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/20 p-4 text-sm text-foreground/70">
          Start typing to search your library content.
        </div>
      ) : totalResults === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/20 p-4 text-sm text-foreground/70">
          No matches found for “{trimmedQuery}”.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <section key={group.type} className="flex flex-col gap-2 rounded-2xl border border-foreground/10 p-3">
              <h2 className="text-xs uppercase tracking-[0.14em] text-foreground/60">
                {group.type} · {group.items.length}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.items.map((item) => (
                  <article key={item.id} className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-foreground/70">{item.subtitle}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-foreground/60">{item.source}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
