export type AppNavItem = {
  href: string;
  label: string;
  symbol: string;
  description: string;
  group: "main" | "library" | "system";
};

export type AppNavGroup = {
  id: "main" | "library" | "system";
  label: string;
  items: AppNavItem[];
};

export const appNavItems: AppNavItem[] = [
  {
    href: "/",
    label: "Home",
    symbol: "home",
    description: "Dashboard with live playback overview",
    group: "main",
  },
  {
    href: "/search",
    label: "Search",
    symbol: "search",
    description: "Unified search surface",
    group: "main",
  },
  {
    href: "/library",
    label: "Library",
    symbol: "library",
    description: "Browse personal and shared media",
    group: "library",
  },
  {
    href: "/favorites",
    label: "Favorites",
    symbol: "favorites",
    description: "Pinned tracks, albums, and playlists",
    group: "library",
  },
  {
    href: "/players",
    label: "Players",
    symbol: "players",
    description: "Playback controls and player states",
    group: "library",
  },
  {
    href: "/rooms",
    label: "Rooms",
    symbol: "rooms",
    description: "Multi-room grouping and control",
    group: "library",
  },
  {
    href: "/devices",
    label: "Devices",
    symbol: "devices",
    description: "Connected device management",
    group: "library",
  },
  {
    href: "/auth",
    label: "Account",
    symbol: "auth",
    description: "Authentication and session management",
    group: "system",
  },
];

export const appNavGroups: AppNavGroup[] = [
  {
    id: "main",
    label: "",
    items: appNavItems.filter((item) => item.group === "main"),
  },
  {
    id: "library",
    label: "Library",
    items: appNavItems.filter((item) => item.group === "library"),
  },
  {
    id: "system",
    label: "",
    items: appNavItems.filter((item) => item.group === "system"),
  },
];

/** Items shown in the mobile bottom tab bar */
export const mobileNavItems: AppNavItem[] = appNavItems.filter((item) =>
  ["/", "/search", "/library", "/players", "/rooms"].includes(item.href),
);
