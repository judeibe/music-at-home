"use client";

import { useDeferredValue, useMemo, useState } from "react";
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
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                <span className="rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground/60">
                  {item.type}
                </span>
              </div>
              <p className="text-sm text-foreground/70">{item.subtitle}</p>
              <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">{item.source}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
