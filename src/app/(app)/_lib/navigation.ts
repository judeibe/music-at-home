export type AppNavItem = {
  href: string;
  label: string;
  symbol: string;
  description: string;
};

export const appNavItems: AppNavItem[] = [
  {
    href: "/",
    label: "Home",
    symbol: "◉",
    description: "Foundation dashboard skeleton",
  },
  {
    href: "/auth",
    label: "Auth",
    symbol: "◎",
    description: "Authentication route shell",
  },
  {
    href: "/players",
    label: "Players",
    symbol: "▷",
    description: "Playback controls and player states",
  },
  {
    href: "/library",
    label: "Library",
    symbol: "▦",
    description: "Browse personal and shared media",
  },
  {
    href: "/search",
    label: "Search",
    symbol: "◌",
    description: "Unified search surface",
  },
  {
    href: "/favorites",
    label: "Favorites",
    symbol: "♡",
    description: "Pinned tracks, albums, and playlists",
  },
  {
    href: "/rooms",
    label: "Rooms",
    symbol: "◫",
    description: "Multi-room grouping and control",
  },
  {
    href: "/devices",
    label: "Devices",
    symbol: "▣",
    description: "Connected device management",
  },
];
