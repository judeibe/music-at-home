import Link from "next/link";

import { getIsAuthenticatedFromSessionApi } from "@/app/(app)/_lib/auth-session";
import { MusicAssistantApiError } from "@/lib/music-assistant/errors";
import {
  executeAuthenticatedMusicAssistantCommand,
  getMusicAssistantClient,
  withMusicAssistantAuth,
} from "@/lib/music-assistant/server";
import type {
  MusicAssistantPlayer,
  MusicAssistantPlayerQueue,
  MusicAssistantServerInfo,
} from "@/lib/music-assistant/types";

type RecentPlaybackItem = {
  playerId: string;
  playerName: string;
  title: string;
  artist: string | null;
  updatedAt: number;
};

function normalizePlayers(result: unknown): MusicAssistantPlayer[] {
  return Array.isArray(result) ? (result as MusicAssistantPlayer[]) : [];
}

function normalizeQueues(result: unknown): MusicAssistantPlayerQueue[] {
  return Array.isArray(result) ? (result as MusicAssistantPlayerQueue[]) : [];
}

function getRecentPlayback(players: MusicAssistantPlayer[]): RecentPlaybackItem[] {
  return players
    .map((player) => {
      const media = player.current_media;
      const title = media?.title?.trim();
      if (!title) return null;
      return {
        playerId: player.player_id,
        playerName: player.name,
        title,
        artist: media?.artist?.trim() || null,
        updatedAt: Number(media?.elapsed_time_last_updated ?? 0),
      };
    })
    .filter((item): item is RecentPlaybackItem => item !== null)
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, 5);
}

const quickActions = [
  {
    href: "/players",
    label: "Players",
    description: "Play, pause, and skip on active endpoints.",
    gradient: "linear-gradient(135deg, #fc3c44 0%, #ff6b6b 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" style={{ width: 24, height: 24 }}>
        <path d="M8 5.14v13.72a1 1 0 0 0 1.5.866l11-6.86a1 1 0 0 0 0-1.732l-11-6.86A1 1 0 0 0 8 5.14Z" />
      </svg>
    ),
  },
  {
    href: "/rooms",
    label: "Rooms",
    description: "Synchronized multi-room playback.",
    gradient: "linear-gradient(135deg, #5856d6 0%, #af52de 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" style={{ width: 24, height: 24 }}>
        <path
          fillRule="evenodd"
          d="M2 5.25A3.25 3.25 0 0 1 5.25 2h13.5A3.25 3.25 0 0 1 22 5.25v10.5A3.25 3.25 0 0 1 18.75 19h-4.257a4.5 4.5 0 0 1 1.379 2.115.75.75 0 0 1-.722.885H8.85a.75.75 0 0 1-.722-.885A4.5 4.5 0 0 1 9.507 19H5.25A3.25 3.25 0 0 1 2 15.75V5.25Zm1.5 0A1.75 1.75 0 0 1 5.25 3.5h13.5A1.75 1.75 0 0 1 20.5 5.25v9.5a1.75 1.75 0 0 1-1.75 1.75H5.25a1.75 1.75 0 0 1-1.75-1.75v-9.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    href: "/devices",
    label: "Devices",
    description: "Manage power, volume, and mute states.",
    gradient: "linear-gradient(135deg, #007aff 0%, #34aadc 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" style={{ width: 24, height: 24 }}>
        <path d="M10 3.5A1.5 1.5 0 0 1 11.5 2h1A1.5 1.5 0 0 1 14 3.5V5h2A1.5 1.5 0 0 1 17.5 6.5v13A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 8 5h2V3.5ZM12 16a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      </svg>
    ),
  },
  {
    href: "/library",
    label: "Library",
    description: "Queue albums, artists, and playlists.",
    gradient: "linear-gradient(135deg, #34c759 0%, #30d158 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" style={{ width: 24, height: 24 }}>
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-13ZM11 7.25a.75.75 0 0 0-1.5 0v9.5a.75.75 0 0 0 1.5 0v-9.5Zm3.75.75a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0V8.75a.75.75 0 0 1 .75-.75ZM8.25 9.5a.75.75 0 0 0-1.5 0v5a.75.75 0 0 0 1.5 0v-5Z" />
      </svg>
    ),
  },
];

export default async function HomePage() {
  const isAuthenticated = await getIsAuthenticatedFromSessionApi();

  let players: MusicAssistantPlayer[] = [];
  let queues: MusicAssistantPlayerQueue[] = [];
  let serverInfo: MusicAssistantServerInfo | null = null;
  let dataErrorMessage: string | null = null;
  let systemErrorMessage: string | null = null;

  const serverInfoPromise = getMusicAssistantClient().getInfo();

  if (isAuthenticated) {
    try {
      const [playersResult, queuesResult] = await Promise.all([
        withMusicAssistantAuth(() =>
          executeAuthenticatedMusicAssistantCommand({ command: "players/all", args: {} }),
        ),
        withMusicAssistantAuth(() =>
          executeAuthenticatedMusicAssistantCommand({ command: "player_queues/all", args: {} }),
        ),
      ]);
      players = normalizePlayers(playersResult);
      queues = normalizeQueues(queuesResult);
    } catch (error) {
      if (error instanceof MusicAssistantApiError && error.status === 401) {
        dataErrorMessage = "Session expired — sign in again on the Account page.";
      } else if (error instanceof Error) {
        dataErrorMessage = error.message;
      } else {
        dataErrorMessage = "Unable to load live dashboard data.";
      }
    }
  }

  try {
    serverInfo = await serverInfoPromise;
  } catch (error) {
    systemErrorMessage =
      error instanceof Error ? error.message : "Cannot reach Music Assistant server.";
  }

  const recentPlayback = getRecentPlayback(players);
  const activeRooms = players.filter(
    (p) => Array.isArray(p.group_childs) && p.group_childs.length > 0,
  );
  const onlinePlayers = players.filter((p) => p.available).length;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Page header ── */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          Good{" "}
          {new Date().getHours() < 12
            ? "morning"
            : new Date().getHours() < 18
              ? "afternoon"
              : "evening"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          {serverInfo
            ? `Music Assistant ${serverInfo.server_version} · Schema ${serverInfo.schema_version}`
            : "Connecting to Music Assistant…"}
        </p>
      </header>

      {/* ── Errors ── */}
      {(dataErrorMessage ?? systemErrorMessage) ? (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(252,60,68,0.08)",
            border: "1px solid rgba(252,60,68,0.2)",
            color: "var(--accent)",
          }}
          role="alert"
        >
          {dataErrorMessage ?? systemErrorMessage}
        </div>
      ) : null}

      {/* ── Stats ── */}
      {isAuthenticated ? (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Players online"
            value={String(onlinePlayers)}
            detail={`${players.length} total`}
          />
          <StatCard
            label="Active rooms"
            value={String(activeRooms.length)}
            detail={`${queues.length} queues`}
          />
          <StatCard
            label="Session"
            value="Active"
            detail="Signed in"
            accentValue
          />
        </div>
      ) : (
        <div
          className="flex flex-col gap-3 rounded-2xl p-5"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Sign in to see live playback data
            </p>
            <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
              Authenticate to unlock player controls, room groups, and queue telemetry.
            </p>
          </div>
          <Link
            href="/auth"
            className="inline-flex self-start rounded-full px-4 py-2 text-sm font-semibold am-transition"
            style={{ background: "var(--accent)", color: "#ffffff" }}
          >
            Go to Account
          </Link>
        </div>
      )}

      {/* ── Quick actions ── */}
      <section aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--fg-secondary)" }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col gap-3 rounded-2xl p-4 am-transition"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-xs)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--shadow-xs)";
              }}
            >
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ background: action.gradient }}
              >
                {action.icon}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {action.label}
                </p>
                <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--fg-secondary)" }}>
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent playback (authenticated only) ── */}
      {isAuthenticated ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="recent-heading">
            <h2
              id="recent-heading"
              className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--fg-secondary)" }}
            >
              Recently Played
            </h2>
            {recentPlayback.length > 0 ? (
              <div
                className="overflow-hidden rounded-2xl"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                {recentPlayback.map((item, idx) => (
                  <div
                    key={`${item.playerId}:${item.title}`}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderTop: idx > 0 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: "linear-gradient(135deg, var(--accent) 0%, #ff8a80 100%)",
                      }}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="white"
                        style={{ width: 12, height: 12, opacity: 0.9 }}
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11v7.78a1.5 1.5 0 0 0 2.3 1.269l5.344-3.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {item.title}
                      </p>
                      <p className="truncate text-xs" style={{ color: "var(--fg-secondary)" }}>
                        {item.artist ? `${item.artist} · ` : ""}
                        {item.playerName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="rounded-2xl px-4 py-5 text-sm"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px dashed var(--border-medium)",
                  color: "var(--fg-secondary)",
                }}
              >
                No recent playback yet.
              </p>
            )}
          </section>

          <section aria-labelledby="rooms-heading">
            <h2
              id="rooms-heading"
              className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--fg-secondary)" }}
            >
              Active Rooms
            </h2>
            {activeRooms.length > 0 ? (
              <div
                className="overflow-hidden rounded-2xl"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                {activeRooms.map((room, idx) => (
                  <div
                    key={room.player_id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
                  >
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: "linear-gradient(135deg, #5856d6 0%, #af52de 100%)",
                      }}
                      aria-hidden="true"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="white"
                        style={{ width: 14, height: 14, opacity: 0.9 }}
                      >
                        <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3Zm0 9.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5Z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        {room.name}
                      </p>
                      <p className="truncate text-xs" style={{ color: "var(--fg-secondary)" }}>
                        {(room.group_childs?.length ?? 0) + 1} members ·{" "}
                        {room.playback_state ?? "unknown"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="rounded-2xl px-4 py-5 text-sm"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px dashed var(--border-medium)",
                  color: "var(--fg-secondary)",
                }}
              >
                No synchronized room groups active.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

/* ── Stat card ── */

function StatCard({
  label,
  value,
  detail,
  accentValue = false,
}: {
  label: string;
  value: string;
  detail: string;
  accentValue?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-2xl p-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--fg-secondary)" }}>
        {label}
      </p>
      <p
        className="text-2xl font-bold tracking-tight"
        style={{ color: accentValue ? "var(--accent)" : "var(--foreground)" }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
        {detail}
      </p>
    </div>
  );
}
