"use client";

import { useMemo, useState } from "react";

import {
  executeMusicAssistantCommand,
  MusicAssistantCommandError,
} from "@/lib/music-assistant/browser";

import {
  requestNowPlayingRefresh,
  setNowPlayingPreferredPlayer,
  useNowPlayingSnapshot,
} from "../_lib/now-playing";
import { runWithRealtimeMutation } from "../_lib/realtime-state";

type TransportCommand = "play" | "pause" | "next" | "previous";

function formatPlaybackState(state: string | null): string {
  if (!state) {
    return "unknown";
  }
  return state.replace(/_/g, " ");
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function NowPlayingShellCard() {
  const { state } = useNowPlayingSnapshot();
  const [activeCommand, setActiveCommand] = useState<TransportCommand | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const player = state.activePlayer;
  const hasQueue = state.activeQueue !== null;
  const queueIsEmpty = hasQueue && (state.queueTotal ?? 0) === 0;

  const progressPercentage = useMemo(() => {
    if (!state.durationSeconds || state.durationSeconds <= 0 || state.elapsedSeconds === null) {
      return 0;
    }
    return Math.max(0, Math.min((state.elapsedSeconds / state.durationSeconds) * 100, 100));
  }, [state.durationSeconds, state.elapsedSeconds]);

  const canPause = player?.supported_features?.includes("pause") ?? false;
  const canSkip = player?.supported_features?.includes("next_previous") ?? false;
  const isPlaying = state.playbackState === "playing";
  const trackTitle = player?.current_media?.title?.trim() ? player.current_media.title : "No track selected";
  const artistName = player?.current_media?.artist?.trim() ? player.current_media.artist : "No artist info";
  const playerStateSummary = player
    ? `${player.name} · ${formatPlaybackState(state.playbackState)}`
    : "No active player";

  async function runTransportCommand(command: TransportCommand) {
    if (!player?.player_id) {
      return;
    }

    setActiveCommand(command);
    setActionError(null);
    setNowPlayingPreferredPlayer(player.player_id);

    try {
      await runWithRealtimeMutation(
        async () =>
          executeMusicAssistantCommand({
            command: `players/cmd/${command}`,
            args: { player_id: player.player_id },
          }),
        { playerId: player.player_id },
      );
    } catch (error) {
      setActionError(
        error instanceof MusicAssistantCommandError
          ? error.message
          : "Unexpected error while controlling playback.",
      );
    } finally {
      setActiveCommand(null);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-foreground/15 bg-background/95 p-4 shadow-[0_8px_24px_-20px_hsl(var(--foreground))]">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60">Now Playing</h2>
        <button
          type="button"
          className="rounded-lg border border-foreground/20 bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-foreground/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={state.status === "loading" || activeCommand !== null}
          onClick={() => void requestNowPlayingRefresh()}
        >
          Refresh
        </button>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-3.5">
        {state.status === "loading" && !player ? (
          <p className="text-sm text-foreground/70">Loading playback…</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold leading-tight">{trackTitle}</p>
                <p className="truncate text-sm text-foreground/70">{artistName}</p>
              </div>
              <p className="shrink-0 rounded-full border border-foreground/15 bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/70">
                {formatPlaybackState(state.playbackState)}
              </p>
            </div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">{playerStateSummary}</p>
          </div>
        )}

        {state.durationSeconds && state.durationSeconds > 0 ? (
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/12">
              <div
                className="h-full rounded-full bg-foreground/70 transition-[width] duration-200"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-foreground/60">
              {state.elapsedSeconds !== null ? formatDuration(state.elapsedSeconds) : "0:00"} /{" "}
              {formatDuration(state.durationSeconds)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className="rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!player?.available || !canSkip || activeCommand !== null}
          onClick={() => void runTransportCommand("previous")}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-xl border border-foreground/25 bg-foreground/[0.08] px-3 py-2 text-sm font-semibold transition-colors hover:bg-foreground/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!player?.available || !canPause || activeCommand !== null}
          onClick={() => void runTransportCommand(isPlaying ? "pause" : "play")}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="rounded-xl border border-foreground/15 bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!player?.available || !canSkip || activeCommand !== null}
          onClick={() => void runTransportCommand("next")}
        >
          Next
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">Queue Preview</p>
          <p className="rounded-full border border-foreground/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground/55">
            {state.queuePreview.length} upcoming
          </p>
        </div>
        {queueIsEmpty ? (
          <p className="text-xs text-foreground/70">Queue is empty.</p>
        ) : state.queuePreview.length > 0 ? (
          <ol className="flex flex-col gap-1 text-xs text-foreground/80">
            {state.queuePreview.map((item, index) => (
              <li
                key={item.queue_item_id}
                className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1 even:border-foreground/10"
              >
                <span className="text-[10px] text-foreground/50">{index + 1}</span>
                <span className="truncate">{item.name}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-foreground/70">No upcoming tracks.</p>
        )}
      </div>

      {state.errorMessage ? (
        <p className="text-xs text-foreground/75" role="alert">
          {state.errorMessage}
        </p>
      ) : null}
      {actionError ? (
        <p className="text-xs text-foreground/75" role="alert">
          {actionError}
        </p>
      ) : null}
    </section>
  );
}
