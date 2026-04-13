import { executeMusicAssistantCommand } from "@/lib/music-assistant/browser";

export type LibraryMediaType = "Track" | "Album" | "Artist" | "Playlist";

export const LIBRARY_MEDIA_TYPES: LibraryMediaType[] = ["Track", "Album", "Artist", "Playlist"];

const LIBRARY_COMMAND_BY_TYPE: Record<LibraryMediaType, string> = {
  Track: "music/tracks/library_items",
  Album: "music/albums/library_items",
  Artist: "music/artists/library_items",
  Playlist: "music/playlists/library_items",
};

type RawMediaItem = Record<string, unknown>;

export type LibraryMediaItem = {
  id: string;
  title: string;
  subtitle: string;
  type: LibraryMediaType;
  source: string;
};

type LibraryPageParams = {
  type: LibraryMediaType;
  query?: string;
  limit: number;
  offset?: number;
  favorite?: boolean;
};

export type LibraryItemsPage = {
  items: LibraryMediaItem[];
  hasMore: boolean;
  nextOffset: number;
};

function isObject(value: unknown): value is RawMediaItem {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toDisplayString(value: unknown): string | null {
  const maybeString = asString(value);
  if (maybeString) return maybeString;
  const maybeNumber = asNumber(value);
  if (maybeNumber !== null) return String(maybeNumber);
  return null;
}

function getArtists(raw: RawMediaItem): string[] {
  const artists = raw.artists;
  if (!Array.isArray(artists)) {
    return [];
  }

  return artists
    .map((entry) => {
      if (!isObject(entry)) return null;
      return asString(entry.name);
    })
    .filter((entry): entry is string => entry !== null);
}

function getAlbumName(raw: RawMediaItem): string | null {
  const album = raw.album;
  if (!isObject(album)) {
    return null;
  }
  return asString(album.name);
}

function getSubtitle(type: LibraryMediaType, raw: RawMediaItem): string {
  const explicitSubtitle = asString(raw.subtitle);
  if (explicitSubtitle) {
    return explicitSubtitle;
  }

  if (type === "Track") {
    const artists = getArtists(raw);
    const albumName = getAlbumName(raw);
    if (artists.length > 0 && albumName) {
      return `${artists.join(", ")} · ${albumName}`;
    }
    if (artists.length > 0) {
      return artists.join(", ");
    }
    if (albumName) {
      return albumName;
    }
  }

  if (type === "Album") {
    const artists = getArtists(raw);
    const year = toDisplayString(raw.year);
    if (artists.length > 0 && year) {
      return `${artists.join(", ")} · ${year}`;
    }
    if (artists.length > 0) {
      return artists.join(", ");
    }
    if (year) {
      return year;
    }
  }

  if (type === "Artist") {
    return "Artist";
  }

  if (type === "Playlist") {
    const owner = asString(raw.owner);
    const tracks = toDisplayString(raw.track_count);
    if (owner && tracks) {
      return `${owner} · ${tracks} tracks`;
    }
    if (tracks) {
      return `${tracks} tracks`;
    }
    if (owner) {
      return owner;
    }
  }

  return "Music Assistant";
}

function getSource(raw: RawMediaItem): string {
  const provider = asString(raw.provider);
  if (provider) {
    return provider;
  }

  const mappings = raw.provider_mappings;
  if (Array.isArray(mappings)) {
    const firstMapping = mappings.find((entry) => isObject(entry));
    if (firstMapping && isObject(firstMapping)) {
      return (
        asString(firstMapping.provider_domain) ??
        asString(firstMapping.provider_instance) ??
        "library"
      );
    }
  }

  return "library";
}

export function normalizeLibraryMediaItem(
  type: LibraryMediaType,
  raw: unknown,
): LibraryMediaItem | null {
  if (!isObject(raw)) {
    return null;
  }

  const id =
    toDisplayString(raw.item_id) ??
    toDisplayString(raw.id) ??
    asString(raw.uri) ??
    null;
  const title = asString(raw.name) ?? asString(raw.title) ?? null;

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    subtitle: getSubtitle(type, raw),
    type,
    source: getSource(raw),
  };
}

export async function fetchLibraryItemsPage(params: LibraryPageParams): Promise<LibraryItemsPage> {
  const args: Record<string, unknown> = {
    limit: params.limit,
    offset: params.offset ?? 0,
  };

  const trimmedQuery = params.query?.trim();
  if (trimmedQuery) {
    args.search = trimmedQuery;
  }

  if (params.favorite !== undefined) {
    args.favorite = params.favorite;
  }

  const result = await executeMusicAssistantCommand<unknown>({
    command: LIBRARY_COMMAND_BY_TYPE[params.type],
    args,
  });

  const rawItems = Array.isArray(result) ? result : [];
  const items = rawItems
    .map((entry) => normalizeLibraryMediaItem(params.type, entry))
    .filter((entry): entry is LibraryMediaItem => entry !== null);

  return {
    items,
    hasMore: rawItems.length >= params.limit,
    nextOffset: (params.offset ?? 0) + rawItems.length,
  };
}

type MultiTypeParams = {
  types: LibraryMediaType[];
  query?: string;
  limit: number;
  offset?: number;
  favorite?: boolean;
};

export async function fetchLibraryItemsForTypes(params: MultiTypeParams): Promise<{
  itemsByType: Record<LibraryMediaType, LibraryMediaItem[]>;
  hasMoreByType: Record<LibraryMediaType, boolean>;
}> {
  const initialItems: Record<LibraryMediaType, LibraryMediaItem[]> = {
    Track: [],
    Album: [],
    Artist: [],
    Playlist: [],
  };
  const initialHasMore: Record<LibraryMediaType, boolean> = {
    Track: false,
    Album: false,
    Artist: false,
    Playlist: false,
  };

  const pages = await Promise.all(
    params.types.map(async (type) => {
      const page = await fetchLibraryItemsPage({
        type,
        query: params.query,
        limit: params.limit,
        offset: params.offset ?? 0,
        favorite: params.favorite,
      });
      return [type, page] as const;
    }),
  );

  for (const [type, page] of pages) {
    initialItems[type] = page.items;
    initialHasMore[type] = page.hasMore;
  }

  return {
    itemsByType: initialItems,
    hasMoreByType: initialHasMore,
  };
}
