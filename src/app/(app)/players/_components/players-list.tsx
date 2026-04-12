"use client";

import { useCallback, useEffect, useState } from "react";

import {
  executeMusicAssistantCommand,
  MusicAssistantCommandError,
} from "@/lib/music-assistant/browser";
import type { MusicAssistantPlayer } from "@/lib/music-assistant/types";

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
  const [players, setPlayers] = useState<MusicAssistantPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCommand, setActiveCommand] = useState<ActiveCommand | null>(null);

  const loadPlayers = useCallback(async (options?: { background?: boolean }) => {
    const isBackgroundLoad = options?.background ?? false;
    if (!isBackgroundLoad) {
      setIsLoading(true);
    }

    try {
      const result = await executeMusicAssistantCommand<MusicAssistantPlayer[]>({
        command: "players/all",
        args: {},
      });

      setPlayers(Array.isArray(result) ? result : []);
      setErrorMessage(null);
    } catch (error) {
      if (error instanceof MusicAssistantCommandError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unexpected error while loading players.");
      }
    } finally {
      if (!isBackgroundLoad) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  const runTransportCommand = useCallback(
    async (playerId: string, command: TransportCommand) => {
      setActiveCommand({ playerId, command });
      setErrorMessage(null);

      try {
        await executeMusicAssistantCommand({
          command: `players/cmd/${command}`,
          args: {
            player_id: playerId,
          },
        });
        await loadPlayers({ background: true });
      } catch (error) {
        if (error instanceof MusicAssistantCommandError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Unexpected error while executing player command.");
        }
      } finally {
        setActiveCommand(null);
      }
    },
    [loadPlayers],
  );

  const renderPlayersContent = () => {
    if (isLoading) {
      return (
        <div
          className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-foreground/70">Loading players…</p>
        </div>
      );
    }

    if (players.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-foreground/20 p-4">
          <p className="text-sm text-foreground/70">No players found.</p>
        </div>
      );
    }

    return (
      <ul className="flex flex-col gap-3">
        {players.map((player) => {
          const isBusy = activeCommand?.playerId === player.player_id;
          const isPlaying = player.playback_state === "playing";
          const supportsPause = player.supported_features?.includes("pause") ?? false;
          const supportsNextPrevious =
            player.supported_features?.includes("next_previous") ?? false;

          return (
            <li
              key={player.player_id}
              className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">{player.name}</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">
                    {player.available ? formatPlaybackState(player.playback_state) : "unavailable"}
                  </p>
                </div>
                <p className="text-xs text-foreground/70">{player.player_id}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous track"
                  className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!player.available || isBusy || !supportsNextPrevious}
                  onClick={() => void runTransportCommand(player.player_id, "previous")}
                >
                  Previous
                </button>
                <button
                  type="button"
                  aria-label={isPlaying ? "Pause playback" : "Play playback"}
                  className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!player.available || isBusy || !supportsPause}
                  onClick={() =>
                    void runTransportCommand(player.player_id, isPlaying ? "pause" : "play")
                  }
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  aria-label="Next track"
                  className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!player.available || isBusy || !supportsNextPrevious}
                  onClick={() => void runTransportCommand(player.player_id, "next")}
                >
                  Next
                </button>
                {isBusy ? (
                  <p className="text-xs text-foreground/70">Sending command…</p>
                ) : null}
              </div>

              <p className="text-xs text-foreground/70">
                {player.current_media?.title
                  ? `${player.current_media.title}${player.current_media.artist ? ` — ${player.current_media.artist}` : ""}`
                  : "No media information"}
              </p>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-foreground/10 bg-background p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Players</h1>
          <p className="text-sm text-foreground/70">
            Control playback for connected players through the shared Music Assistant session.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading || activeCommand !== null}
          onClick={() => void loadPlayers()}
        >
          Refresh
        </button>
      </header>

      {errorMessage ? (
        <div
          className="rounded-2xl border border-foreground/20 bg-foreground/[0.04] p-3"
          role="alert"
        >
          <p className="text-sm text-foreground/80">{errorMessage}</p>
        </div>
      ) : null}

      {renderPlayersContent()}
    </section>
  );
}
