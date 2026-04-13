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
  if (!state) return "unknown";
  return state.replace(/_/g, " ");
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type Props = {
  compact?: boolean;
};

export function NowPlayingShellCard({ compact = false }: Props) {
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
  const isLoading = state.status === "loading" && !player;
  const title = player?.current_media?.title?.trim() || null;
  const artist = player?.current_media?.artist?.trim() || null;

  async function runTransportCommand(command: TransportCommand) {
    if (!player?.player_id) return;
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
          : "Playback control failed.",
      );
    } finally {
      setActiveCommand(null);
    }
  }

  const isBusy = activeCommand !== null || state.status === "loading";

  return (
    <div className="flex flex-col gap-3" style={{ padding: compact ? "12px" : "16px" }}>
      {/* Track info row */}
      <div className="flex items-center gap-3">
        {/* Artwork placeholder */}
        <div
          className="shrink-0 rounded-md"
          style={{
            width: 40,
            height: 40,
            background: title
              ? "linear-gradient(135deg, var(--accent) 0%, #ff6b6b 100%)"
              : "var(--bg-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: title ? "var(--shadow-sm)" : "none",
          }}
          aria-hidden="true"
        >
          {title ? (
            <svg
              viewBox="0 0 16 16"
              fill="white"
              style={{ width: 16, height: 16, opacity: 0.8 }}
            >
              <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11v7.78a1.5 1.5 0 0 0 2.3 1.269l5.344-3.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }}
            >
              <path d="M8 1a1 1 0 0 1 1 1v5.268l3.528-2.036a1 1 0 1 1 1 1.732L10 9l3.528 2.036a1 1 0 1 1-1 1.732L9 10.732V16a1 1 0 1 1-2 0v-5.268L3.472 12.768a1 1 0 1 1-1-1.732L5.999 9.03 2.472 6.994a1 1 0 0 1 1-1.732L7 7.268V2a1 1 0 0 1 1-1Z" />
            </svg>
          )}
        </div>

        {/* Title / artist */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div
              className="h-3 w-24 rounded-full"
              style={{ background: "var(--bg-elevated)" }}
            />
          ) : (
            <>
              <p
                className="truncate text-sm font-semibold leading-snug"
                style={{ color: "var(--foreground)" }}
              >
                {title ?? "No track selected"}
              </p>
              <p
                className="truncate text-[12px] leading-snug"
                style={{ color: "var(--fg-secondary)" }}
              >
                {artist ?? (player?.name ?? "No active player")}
              </p>
              {player ? (
                <p
                  className="truncate text-[11px] uppercase tracking-[0.1em] leading-snug"
                  style={{ color: "var(--fg-tertiary)" }}
                >
                  {`${player.name} · ${formatPlaybackState(state.playbackState)}`}
                </p>
              ) : null}
            </>
          )}
        </div>

        {/* Refresh */}
        <button
          type="button"
          aria-label="Refresh now playing"
          className="shrink-0 rounded-md p-1 am-transition"
          style={{ color: "var(--fg-tertiary)" }}
          disabled={isBusy}
          onClick={() => void requestNowPlayingRefresh()}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-secondary)";
            (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-overlay-strong)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-tertiary)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
            <path
              fillRule="evenodd"
              d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08 1.02.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.358l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.358l-.842-.84v1.371a.75.75 0 0 1-1.5 0V9.705a.75.75 0 0 1 .75-.75h3.182a.75.75 0 0 1 0 1.5H4.069l.84.84a4.5 4.5 0 0 0 7.08-1.02.75.75 0 0 1 1.024-.278Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {state.durationSeconds && state.durationSeconds > 0 ? (
        <div className="flex flex-col gap-1">
          <div
            className="h-1 w-full overflow-hidden rounded-full"
            style={{ background: "var(--bg-overlay-strong)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressPercentage}%`,
                background: "var(--accent)",
                transition: "width 200ms linear",
              }}
            />
          </div>
          <div
            className="flex justify-between text-[10px]"
            style={{ color: "var(--fg-tertiary)" }}
          >
            <span>
              {state.elapsedSeconds !== null ? formatDuration(state.elapsedSeconds) : "0:00"}
            </span>
            <span>{formatDuration(state.durationSeconds)}</span>
          </div>
        </div>
      ) : null}

      {/* Transport controls */}
      <div className="flex items-center justify-between">
        <TransportButton
          aria-label="Previous"
          disabled={!player?.available || !canSkip || isBusy}
          onClick={() => void runTransportCommand("previous")}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
            <path d="M7.712 5.123A1.5 1.5 0 0 0 5.5 6.39v7.22a1.5 1.5 0 0 0 2.212 1.267l6.5-3.61a1.5 1.5 0 0 0 0-2.534L7.712 5.123ZM15.5 5.75a.75.75 0 0 0-1.5 0v8.5a.75.75 0 0 0 1.5 0v-8.5Z" />
          </svg>
        </TransportButton>

        <TransportButton
          aria-label={isPlaying ? "Pause" : "Play"}
          disabled={!player?.available || !canPause || isBusy}
          onClick={() => void runTransportCommand(isPlaying ? "pause" : "play")}
          primary
        >
          {isPlaying ? (
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
              <path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}>
              <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
            </svg>
          )}
        </TransportButton>

        <TransportButton
          aria-label="Next"
          disabled={!player?.available || !canSkip || isBusy}
          onClick={() => void runTransportCommand("next")}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
            <path d="M3 5.75a.75.75 0 0 1 1.5 0v8.5a.75.75 0 0 1-1.5 0V5.75ZM12.288 5.123A1.5 1.5 0 0 1 14.5 6.39v7.22a1.5 1.5 0 0 1-2.212 1.267l-6.5-3.61a1.5 1.5 0 0 1 0-2.534l6.5-3.61Z" />
          </svg>
        </TransportButton>
      </div>

      {/* Queue preview (only when not compact or when there's something to show) */}
      {!compact ? (
        <div
          className="flex flex-col gap-2 rounded-xl p-3"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border)" }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.1em] font-medium"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Queue Preview
          </p>
          {queueIsEmpty ? (
            <p className="text-xs" style={{ color: "var(--fg-secondary)" }}>
              Queue is empty.
            </p>
          ) : state.queuePreview.length > 0 ? (
            <ol className="flex flex-col gap-1">
              {state.queuePreview.map((item) => (
                <li
                  key={item.queue_item_id}
                  className="truncate text-xs"
                  style={{ color: "var(--fg-secondary)" }}
                >
                  {item.name}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs" style={{ color: "var(--fg-secondary)" }}>
              No upcoming tracks.
            </p>
          )}
        </div>
      ) : null}

      {/* Errors */}
      {state.errorMessage ? (
        <p role="alert" className="text-[11px]" style={{ color: "var(--accent)" }}>
          {state.errorMessage}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" className="text-[11px]" style={{ color: "var(--accent)" }}>
          {actionError}
        </p>
      ) : null}
    </div>
  );
}

/* ── Transport button ── */

type TransportButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  primary?: boolean;
  children: React.ReactNode;
};

function TransportButton({ primary = false, children, ...props }: TransportButtonProps) {
  if (primary) {
    return (
      <button
        type="button"
        {...props}
        className="flex size-9 items-center justify-center rounded-full am-transition disabled:opacity-40"
        style={{ background: "var(--accent)", color: "#ffffff" }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      {...props}
      className="flex size-8 items-center justify-center rounded-full am-transition disabled:opacity-40"
      style={{ color: "var(--fg-secondary)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-overlay-strong)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-secondary)";
      }}
    >
      {children}
    </button>
  );
}
