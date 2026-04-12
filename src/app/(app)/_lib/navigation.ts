export type AppNavItem = {
  href: string;
  label: string;
  description: string;
};

export const appNavItems: AppNavItem[] = [
  { href: "/", label: "Home", description: "Foundation dashboard skeleton" },
  { href: "/auth", label: "Auth", description: "Authentication route shell" },
  {
    href: "/players",
    label: "Players",
    description: "Playback controls and player states",
  },
  {
    href: "/library",
    label: "Library",
    description: "Browse personal and shared media",
  },
  { href: "/search", label: "Search", description: "Unified search surface" },
  {
    href: "/favorites",
    label: "Favorites",
    description: "Pinned tracks, albums, and playlists",
  },
  {
    href: "/rooms",
    label: "Rooms",
    description: "Multi-room grouping and control",
  },
  {
    href: "/devices",
    label: "Devices",
    description: "Connected device management",
  },
];
