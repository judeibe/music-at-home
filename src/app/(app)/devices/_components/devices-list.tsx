"use client";

import { useCallback, useEffect, useState } from "react";

import {
  executeMusicAssistantCommand,
  MusicAssistantCommandError,
} from "@/lib/music-assistant/browser";
import type { MusicAssistantPlayer } from "@/lib/music-assistant/types";

type ActiveAction =
  | { kind: "power"; playerId: string }
  | { kind: "mute"; playerId: string }
  | { kind: "volume"; playerId: string };

function formatPlaybackState(state: string | undefined): string {
  if (!state) return "unknown";
  return state.replace(/_/g, " ");
}

function VolumeControl({
  player,
  isBusy,
  onVolume,
}: {
  player: MusicAssistantPlayer;
  isBusy: boolean;
  onVolume: (playerId: string, level: number) => Promise<void>;
}) {
  const supportsVolume = player.supported_features?.includes("volume_set") ?? false;
  const currentVolume = player.volume_level ?? 0;
  const [localVolume, setLocalVolume] = useState(currentVolume);

  // Keep slider in sync when player state is refreshed
  useEffect(() => {
    setLocalVolume(currentVolume);
  }, [currentVolume]);

  if (!supportsVolume) {
    return <span className="text-xs text-foreground/40">Volume not supported</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`vol-${player.player_id}`} className="text-xs text-foreground/60">
        Vol
      </label>
      <input
        id={`vol-${player.player_id}`}
        type="range"
        min={0}
        max={100}
        step={1}
        value={localVolume}
        disabled={!player.available || isBusy}
        className="w-24 accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
        onChange={(e) => setLocalVolume(Number(e.target.value))}
        onMouseUp={(e) => {
          void onVolume(player.player_id, Number((e.target as HTMLInputElement).value));
        }}
        onTouchEnd={(e) => {
          void onVolume(player.player_id, Number((e.target as HTMLInputElement).value));
        }}
      />
      <span className="w-7 text-right text-xs tabular-nums text-foreground/70">
        {localVolume}
      </span>
    </div>
  );
}

export function DevicesList() {
  const [players, setPlayers] = useState<MusicAssistantPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);

  const loadPlayers = useCallback(async (options?: { background?: boolean }) => {
    const isBackground = options?.background ?? false;
    if (!isBackground) setIsLoading(true);
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
        setErrorMessage("Unexpected error while loading devices.");
      }
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  const togglePower = useCallback(
    async (player: MusicAssistantPlayer) => {
      const supportsPower = player.supported_features?.includes("power") ?? false;
      if (!supportsPower) return;

      setActiveAction({ kind: "power", playerId: player.player_id });
      setErrorMessage(null);
      try {
        const powered = player.playback_state !== "idle";
        await executeMusicAssistantCommand({
          command: "players/cmd/power",
          args: { player_id: player.player_id, powered: !powered },
        });
        await loadPlayers({ background: true });
      } catch (error) {
        setErrorMessage(
          error instanceof MusicAssistantCommandError
            ? error.message
            : "Unexpected error toggling power.",
        );
      } finally {
        setActiveAction(null);
      }
    },
    [loadPlayers],
  );

  const toggleMute = useCallback(
    async (player: MusicAssistantPlayer) => {
      const supportsMute = player.supported_features?.includes("volume_mute") ?? false;
      if (!supportsMute) return;

      setActiveAction({ kind: "mute", playerId: player.player_id });
      setErrorMessage(null);
      try {
        await executeMusicAssistantCommand({
          command: "players/cmd/mute",
          args: { player_id: player.player_id, muted: !player.volume_muted },
        });
        await loadPlayers({ background: true });
      } catch (error) {
        setErrorMessage(
          error instanceof MusicAssistantCommandError
            ? error.message
            : "Unexpected error toggling mute.",
        );
      } finally {
        setActiveAction(null);
      }
    },
    [loadPlayers],
  );

  const setVolume = useCallback(
    async (playerId: string, level: number) => {
      setActiveAction({ kind: "volume", playerId });
      setErrorMessage(null);
      try {
        await executeMusicAssistantCommand({
          command: "players/cmd/volume_set",
          args: { player_id: playerId, volume_level: level },
        });
        await loadPlayers({ background: true });
      } catch (error) {
        setErrorMessage(
          error instanceof MusicAssistantCommandError
            ? error.message
            : "Unexpected error setting volume.",
        );
      } finally {
        setActiveAction(null);
      }
    },
    [loadPlayers],
  );

  const isBusy = activeAction !== null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div
          className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-foreground/70">Loading devices…</p>
        </div>
      );
    }

    if (players.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-foreground/20 p-4">
          <p className="text-sm text-foreground/70">No devices found.</p>
        </div>
      );
    }

    return (
      <ul className="flex flex-col gap-3">
        {players.map((player) => {
          const supportsPower = player.supported_features?.includes("power") ?? false;
          const supportsMute = player.supported_features?.includes("volume_mute") ?? false;
          const isActionActive =
            activeAction?.playerId === player.player_id;
          const isPowered = player.available && player.playback_state !== "idle";

          return (
            <li
              key={player.player_id}
              className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">{player.name}</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">
                    {player.available
                      ? formatPlaybackState(player.playback_state)
                      : "unavailable"}
                    {" · "}
                    {player.provider}
                  </p>
                </div>

                {/* Availability badge */}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    player.available
                      ? "bg-foreground/10 text-foreground/80"
                      : "bg-foreground/5 text-foreground/40"
                  }`}
                >
                  {player.available ? "Online" : "Offline"}
                </span>
              </div>

              {/* Controls row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Power toggle */}
                {supportsPower ? (
                  <button
                    type="button"
                    aria-label={isPowered ? "Power off" : "Power on"}
                    className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() => void togglePower(player)}
                  >
                    {activeAction?.kind === "power" && isActionActive
                      ? "Toggling…"
                      : isPowered
                        ? "Power Off"
                        : "Power On"}
                  </button>
                ) : (
                  <span className="text-xs text-foreground/40">Power not supported</span>
                )}

                {/* Mute toggle */}
                {supportsMute ? (
                  <button
                    type="button"
                    aria-label={player.volume_muted ? "Unmute" : "Mute"}
                    className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!player.available || isBusy}
                    onClick={() => void toggleMute(player)}
                  >
                    {activeAction?.kind === "mute" && isActionActive
                      ? "Toggling…"
                      : player.volume_muted
                        ? "Unmute"
                        : "Mute"}
                  </button>
                ) : (
                  <span className="text-xs text-foreground/40">Mute not supported</span>
                )}
              </div>

              {/* Volume control */}
              <VolumeControl
                player={player}
                isBusy={isBusy && activeAction?.kind === "volume" && isActionActive}
                onVolume={setVolume}
              />

              {/* Currently playing */}
              {player.current_media?.title && (
                <p className="text-xs text-foreground/70">
                  {player.current_media.title}
                  {player.current_media.artist ? ` — ${player.current_media.artist}` : ""}
                </p>
              )}

              {/* Device ID */}
              <p className="text-xs text-foreground/40">{player.player_id}</p>
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
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Devices</h1>
          <p className="text-sm text-foreground/70">
            Manage connected devices — power, volume, and status for each player.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading || isBusy}
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

      {renderContent()}
    </section>
  );
}
