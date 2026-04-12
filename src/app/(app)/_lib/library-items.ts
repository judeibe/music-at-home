export type LibraryItemType = "Track" | "Album" | "Artist" | "Playlist";
export type LibraryItemSource = "Personal" | "Shared" | "Room";

export type LibraryItem = {
  id: string;
  title: string;
  subtitle: string;
  type: LibraryItemType;
  source: LibraryItemSource;
  keywords: string[];
};

export const libraryItems: readonly LibraryItem[] = [
  {
    id: "track-midnight-city",
    title: "Midnight City",
    subtitle: "M83 · Hurry Up, We're Dreaming",
    type: "Track",
    source: "Personal",
    keywords: ["synthwave", "night drive", "favorites"],
  },
  {
    id: "track-redbone",
    title: "Redbone",
    subtitle: "Childish Gambino · Awaken, My Love!",
    type: "Track",
    source: "Shared",
    keywords: ["funk", "soul", "weekend mix"],
  },
  {
    id: "album-discovery",
    title: "Discovery",
    subtitle: "Daft Punk · 2001",
    type: "Album",
    source: "Personal",
    keywords: ["electronic", "classic", "french house"],
  },
  {
    id: "album-melodrama",
    title: "Melodrama",
    subtitle: "Lorde · 2017",
    type: "Album",
    source: "Shared",
    keywords: ["pop", "late night", "lyric-heavy"],
  },
  {
    id: "artist-khruangbin",
    title: "Khruangbin",
    subtitle: "Artist profile · 38 saved tracks",
    type: "Artist",
    source: "Personal",
    keywords: ["instrumental", "groove", "chill"],
  },
  {
    id: "artist-fka-twigs",
    title: "FKA twigs",
    subtitle: "Artist profile · 24 saved tracks",
    type: "Artist",
    source: "Shared",
    keywords: ["alternative", "experimental", "vocal"],
  },
  {
    id: "playlist-kitchen-jazz",
    title: "Kitchen Jazz",
    subtitle: "Playlist · 2h 17m · 42 tracks",
    type: "Playlist",
    source: "Room",
    keywords: ["jazz", "morning", "cooking"],
  },
  {
    id: "playlist-party-floor",
    title: "Party Floor",
    subtitle: "Playlist · 3h 05m · 58 tracks",
    type: "Playlist",
    source: "Shared",
    keywords: ["dance", "house", "energy"],
  },
];

export function matchesLibraryQuery(item: LibraryItem, query: string) {
  const terms = query
    .toLowerCase()
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (terms.length === 0) {
    return true;
  }

  const haystack = [item.title, item.subtitle, item.type, item.source, ...item.keywords]
    .join(" ")
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
}
