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
      if (!title) {
        return null;
      }

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

function formatSystemStatusLabel(params: {
  isAuthenticated: boolean;
  hasDataError: boolean;
  hasSystemError: boolean;
}): string {
  if (!params.isAuthenticated) {
    return "Authentication required";
  }

  if (params.hasDataError || params.hasSystemError) {
    return "Attention needed";
  }

  return "Healthy";
}

const quickActions = [
  {
    href: "/players",
    title: "Player controls",
    description: "Play, pause, and skip on active endpoints.",
  },
  {
    href: "/rooms",
    title: "Room groups",
    description: "Start or adjust synchronized multi-room playback.",
  },
  {
    href: "/devices",
    title: "Device operations",
    description: "Manage power, volume, and mute states.",
  },
  {
    href: "/library",
    title: "Browse library",
    description: "Queue albums, artists, and playlists fast.",
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
          executeAuthenticatedMusicAssistantCommand({
            command: "players/all",
            args: {},
          }),
        ),
        withMusicAssistantAuth(() =>
          executeAuthenticatedMusicAssistantCommand({
            command: "player_queues/all",
            args: {},
          }),
        ),
      ]);

      players = normalizePlayers(playersResult);
      queues = normalizeQueues(queuesResult);
    } catch (error) {
      if (error instanceof MusicAssistantApiError && error.status === 401) {
        dataErrorMessage = "Your Music Assistant session expired. Sign in again on the auth route.";
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
    if (error instanceof Error) {
      systemErrorMessage = error.message;
    } else {
      systemErrorMessage = "Unable to reach Music Assistant server info endpoint.";
    }
  }

  const recentPlayback = getRecentPlayback(players);
  const activeRooms = players.filter(
    (player) => Array.isArray(player.group_childs) && player.group_childs.length > 0,
  );
  const onlinePlayers = players.filter((player) => player.available).length;
  const systemStatusLabel = formatSystemStatusLabel({
    isAuthenticated,
    hasDataError: dataErrorMessage !== null,
    hasSystemError: systemErrorMessage !== null,
  });
  const statusChipClass =
    systemStatusLabel === "Healthy"
      ? "border-accent/35 bg-accent/10 text-accent-strong"
      : "border-border-subtle bg-surface-2 text-foreground/80";

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border-subtle bg-background p-5 shadow-elevation-1">
      <header className="rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-elevation-1">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/60">
          Home surface
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Home dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground/75">
          Monitor active playback, jump to control surfaces, and keep your listening system in a
          ready state.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-elevation-1">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">System status</p>
          <p
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusChipClass}`}
          >
            {systemStatusLabel}
          </p>
          <p className="mt-2 text-xs text-foreground/70">
            Session: {isAuthenticated ? "Signed in" : "Signed out"}
          </p>
        </article>
        <article className="rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-elevation-1">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Players online</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{onlinePlayers}</p>
          <p className="mt-1 text-xs text-foreground/70">
            {players.length} total players, {queues.length} queues tracked
          </p>
        </article>
        <article className="rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-elevation-1">
          <p className="text-xs uppercase tracking-[0.14em] text-foreground/60">Server version</p>
          <p className="mt-2 text-sm font-semibold">{serverInfo?.server_version ?? "Unavailable"}</p>
          <p className="mt-1 text-xs text-foreground/70">
            Schema {serverInfo?.schema_version ?? "unknown"}
          </p>
        </article>
      </div>

      {dataErrorMessage ? (
        <p role="alert" className="rounded-2xl border border-border-subtle bg-surface-2 p-3 text-sm">
          {dataErrorMessage}
        </p>
      ) : null}
      {systemErrorMessage ? (
        <p role="alert" className="rounded-2xl border border-border-subtle bg-surface-2 p-3 text-sm">
          {systemErrorMessage}
        </p>
      ) : null}

      {!isAuthenticated ? (
        <section className="rounded-2xl border border-dashed border-border-subtle bg-surface-1 p-4">
          <h2 className="text-sm font-semibold">Sign in to load live playback data</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Authenticate on the auth route to unlock player, room, and queue telemetry on this
            dashboard.
          </p>
          <Link
            href="/auth"
            className="mt-3 inline-flex rounded-full border border-border-subtle bg-background px-4 py-1.5 text-sm font-semibold transition hover:bg-surface-2"
          >
            Go to auth
          </Link>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <section
            aria-labelledby="recent-playback-heading"
            className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-elevation-1"
          >
            <h2 id="recent-playback-heading" className="text-sm font-semibold uppercase tracking-[0.12em]">
              Recent playback
            </h2>
            {recentPlayback.length > 0 ? (
              <ol className="flex flex-col gap-2">
                {recentPlayback.map((item) => (
                  <li
                    key={`${item.playerId}:${item.title}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border-subtle bg-background p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="truncate text-xs text-foreground/70">
                        {item.artist ? `${item.artist} · ` : ""}
                        {item.playerName}
                      </p>
                    </div>
                    <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground/60">
                      recent
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-xl border border-dashed border-border-subtle bg-background p-3 text-sm text-foreground/70">
                No recent playback metadata is available yet.
              </p>
            )}
          </section>

          <section
            aria-labelledby="active-rooms-heading"
            className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-elevation-1"
          >
            <h2 id="active-rooms-heading" className="text-sm font-semibold uppercase tracking-[0.12em]">
              Active rooms
            </h2>
            <p className="text-sm text-foreground/70">{activeRooms.length} active room groups</p>
            {activeRooms.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {activeRooms.map((room) => (
                  <li
                    key={room.player_id}
                    className="rounded-xl border border-border-subtle bg-background p-3"
                  >
                    <p className="text-sm font-semibold">{room.name}</p>
                    <p className="text-xs text-foreground/70">
                      {(room.group_childs?.length ?? 0) + 1} members ·{" "}
                      {room.playback_state ?? "unknown"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-border-subtle bg-background p-3 text-sm text-foreground/70">
                No synchronized rooms are active.
              </p>
            )}
          </section>
        </div>
      )}

      <section aria-labelledby="quick-actions-heading" className="flex flex-col gap-3">
        <h2 id="quick-actions-heading" className="text-sm font-semibold uppercase tracking-[0.12em]">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-elevation-1 transition hover:bg-surface-2"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-semibold">{action.title}</span>
                <span className="text-xs text-foreground/70">{action.description}</span>
              </span>
              <span
                aria-hidden="true"
                className="rounded-full border border-border-subtle bg-background px-2 py-0.5 text-xs text-foreground/60 transition group-hover:text-accent-strong"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
