"use client";

import { useCallback, useState } from "react";

import {
  executeMusicAssistantCommand,
  MusicAssistantCommandError,
} from "@/lib/music-assistant/browser";
import {
  runWithRealtimeMutation,
  useRealtimeSnapshot,
} from "../../_lib/realtime-state";
import { setNowPlayingPreferredPlayer } from "../../_lib/now-playing";

type TransportCommand = "play" | "pause" | "next" | "previous";

type ActiveCommand = {
  playerId: string;
  command: TransportCommand;
};

function formatPlaybackState(state: string | undefined): string {
  if (!state) {
    return "unknown";
  }
  return state.replace(/_/g, " ");
}

export function PlayersList() {
  const { state, refresh } = useRealtimeSnapshot();
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [activeCommand, setActiveCommand] = useState<ActiveCommand | null>(null);
  const players = state.players;
  const isLoading = state.status === "idle" || state.status === "loading";
  const errorMessage = actionErrorMessage ?? state.errorMessage;

  const runTransportCommand = useCallback(
    async (playerId: string, command: TransportCommand) => {
      setActiveCommand({ playerId, command });
      setActionErrorMessage(null);
      setNowPlayingPreferredPlayer(playerId);

      try {
        await runWithRealtimeMutation(
          async () =>
            executeMusicAssistantCommand({
              command: `players/cmd/${command}`,
              args: {
                player_id: playerId,
              },
            }),
          { playerId },
        );
      } catch (error) {
        if (error instanceof MusicAssistantCommandError) {
          setActionErrorMessage(error.message);
        } else {
          setActionErrorMessage("Unexpected error while executing player command.");
        }
      } finally {
        setActiveCommand(null);
      }
    },
    [],
  );

  const handleManualRefresh = useCallback(async () => {
    setActionErrorMessage(null);
    try {
      await refresh();
    } catch (error) {
      if (error instanceof MusicAssistantCommandError) {
        setActionErrorMessage(error.message);
      } else {
        setActionErrorMessage("Unexpected error while loading players.");
      }
    }
  }, [refresh]);

  const renderPlayersContent = () => {
    if (isLoading) {
      return (
        <div
          className="rounded-2xl px-4 py-8 text-center text-sm"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--fg-secondary)" }}
          role="status"
          aria-live="polite"
        >
          Loading players…
        </div>
      );
    }

    if (players.length === 0) {
      return (
        <p
          className="rounded-2xl px-4 py-8 text-center text-sm"
          style={{
            background: "var(--bg-surface)",
            border: "1px dashed var(--border-medium)",
            color: "var(--fg-secondary)",
          }}
        >
          No players found.
        </p>
      );
    }

    return (
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {players.map((player, idx) => {
          const isBusy = activeCommand?.playerId === player.player_id;
          const isPlaying = player.playback_state === "playing";
          const supportsPause = player.supported_features?.includes("pause") ?? false;
          const supportsNextPrevious = player.supported_features?.includes("next_previous") ?? false;

          return (
            <div
              key={player.player_id}
              className="flex flex-col gap-3 px-4 py-4"
              style={{ borderTop: idx > 0 ? "1px solid var(--border)" : "none" }}
            >
              {/* Player header */}
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: player.available
                      ? "linear-gradient(135deg, var(--accent) 0%, #ff8a80 100%)"
                      : "var(--bg-elevated)",
                  }}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 16 16" fill="white" style={{ width: 14, height: 14, opacity: player.available ? 0.9 : 0.4 }}>
                    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11v7.78a1.5 1.5 0 0 0 2.3 1.269l5.344-3.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {player.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--fg-secondary)" }}>
                    {player.available ? formatPlaybackState(player.playback_state) : "Unavailable"}
                    {player.current_media?.title ? ` · ${player.current_media.title}` : ""}
                    {player.current_media?.artist ? ` — ${player.current_media.artist}` : ""}
                  </p>
                </div>
                {/* Availability dot */}
                <div
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: player.available ? "#34c759" : "var(--fg-tertiary)" }}
                  aria-label={player.available ? "Available" : "Unavailable"}
                />
              </div>

              {/* Transport controls */}
              <div className="flex items-center gap-2 pl-[52px]">
                <SmallTransportButton
                  aria-label="Previous track"
                  disabled={!player.available || isBusy || !supportsNextPrevious}
                  onClick={() => void runTransportCommand(player.player_id, "previous")}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
                    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11v7.78a1.5 1.5 0 0 0 2.3 1.269l4.344-3.16a1.5 1.5 0 0 0 0-2.538L6.3 2.84ZM13 3.25a.75.75 0 0 0-1.5 0v9.5a.75.75 0 0 0 1.5 0V3.25Z" />
                  </svg>
                </SmallTransportButton>

                <button
                  type="button"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  disabled={!player.available || isBusy || !supportsPause}
                  className="flex size-8 items-center justify-center rounded-full am-transition disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {isPlaying ? (
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }} onClick={() => void runTransportCommand(player.player_id, "pause")}>
                      <path d="M4.5 2.5a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5h-2ZM9.5 2.5a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5h-2Z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, height: 12 }} onClick={() => void runTransportCommand(player.player_id, "play")}>
                      <path d="M5.3 2.841A1.5 1.5 0 0 0 3 4.11v7.78a1.5 1.5 0 0 0 2.3 1.269l7.344-3.89a1.5 1.5 0 0 0 0-2.538L5.3 2.84Z" />
                    </svg>
                  )}
                </button>

                <SmallTransportButton
                  aria-label="Next track"
                  disabled={!player.available || isBusy || !supportsNextPrevious}
                  onClick={() => void runTransportCommand(player.player_id, "next")}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14 }}>
                    <path d="M2.5 3.25a.75.75 0 0 1 1.5 0v9.5a.75.75 0 0 1-1.5 0V3.25ZM9.7 2.841A1.5 1.5 0 0 1 12 4.11v7.78a1.5 1.5 0 0 1-2.3 1.269L5.356 9.3a1.5 1.5 0 0 1 0-2.538L9.7 2.84Z" />
                  </svg>
                </SmallTransportButton>

                {isBusy ? (
                  <span className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
                    …
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Players
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
            Control playback on connected Music Assistant players.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full px-4 py-2 text-sm font-medium am-transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
          disabled={isLoading || activeCommand !== null}
          onClick={() => void handleManualRefresh()}
        >
          Refresh
        </button>
      </header>

      {errorMessage ? (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(252,60,68,0.08)",
            border: "1px solid rgba(252,60,68,0.2)",
            color: "var(--accent)",
          }}
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {renderPlayersContent()}
    </div>
  );
}

function SmallTransportButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <button
      type="button"
      {...props}
      className="flex size-7 items-center justify-center rounded-full am-transition disabled:cursor-not-allowed disabled:opacity-40"
      style={{ color: "var(--fg-secondary)", background: "transparent" }}
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
