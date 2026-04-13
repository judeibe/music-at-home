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
  const { state, refresh } = useNowPlayingSnapshot();
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

  async function runTransportCommand(command: TransportCommand) {
    if (!player?.player_id) {
      return;
    }

    setActiveCommand(command);
    setActionError(null);
    setNowPlayingPreferredPlayer(player.player_id);

    try {
      await executeMusicAssistantCommand({
        command: `players/cmd/${command}`,
        args: { player_id: player.player_id },
      });
      await refresh({ playerId: player.player_id });
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
    <section className="flex flex-col gap-3 rounded-3xl border border-foreground/10 bg-background px-4 py-3">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-xs uppercase tracking-[0.16em] text-foreground/60">Now Playing</h2>
        <button
          type="button"
          className="rounded-lg border border-foreground/15 px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          disabled={state.status === "loading" || activeCommand !== null}
          onClick={() => void requestNowPlayingRefresh()}
        >
          Refresh
        </button>
      </header>

      {state.status === "loading" && !player ? (
        <p className="text-sm text-foreground/70">Loading playback…</p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            {player?.current_media?.title?.trim() ? player.current_media.title : "No track selected"}
          </p>
          <p className="text-xs text-foreground/65">
            {player?.current_media?.artist?.trim() ? player.current_media.artist : "No artist info"}
          </p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">
            {player ? `${player.name} · ${formatPlaybackState(state.playbackState)}` : "No active player"}
          </p>
        </div>
      )}

      {state.durationSeconds && state.durationSeconds > 0 ? (
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-foreground/60 transition-[width] duration-200"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-foreground/60">
            {state.elapsedSeconds !== null ? formatDuration(state.elapsedSeconds) : "0:00"} /{" "}
            {formatDuration(state.durationSeconds)}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!player?.available || !canSkip || activeCommand !== null}
          onClick={() => void runTransportCommand("previous")}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!player?.available || !canPause || activeCommand !== null}
          onClick={() => void runTransportCommand(isPlaying ? "pause" : "play")}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!player?.available || !canSkip || activeCommand !== null}
          onClick={() => void runTransportCommand("next")}
        >
          Next
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-3">
        <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">Queue Preview</p>
        {queueIsEmpty ? (
          <p className="text-xs text-foreground/70">Queue is empty.</p>
        ) : state.queuePreview.length > 0 ? (
          <ol className="flex flex-col gap-1 text-xs text-foreground/80">
            {state.queuePreview.map((item) => (
              <li key={item.queue_item_id} className="truncate">
                {item.name}
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
