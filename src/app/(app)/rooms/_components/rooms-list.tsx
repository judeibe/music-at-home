"use client";

import { useCallback, useRef, useState } from "react";

import {
  executeMusicAssistantCommand,
  MusicAssistantCommandError,
} from "@/lib/music-assistant/browser";
import type { MusicAssistantPlayer } from "@/lib/music-assistant/types";
import {
  runWithRealtimeMutation,
  useRealtimeSnapshot,
} from "../../_lib/realtime-state";
import { setNowPlayingPreferredPlayer } from "../../_lib/now-playing";

type GroupedRoom = {
  leader: MusicAssistantPlayer;
  members: MusicAssistantPlayer[];
};

type ActiveAction =
  | { kind: "transport"; playerId: string; command: string }
  | { kind: "ungroup"; playerId: string }
  | { kind: "group"; targetId: string; memberId: string };

function buildRooms(players: MusicAssistantPlayer[]): {
  rooms: GroupedRoom[];
  standalone: MusicAssistantPlayer[];
} {
  const memberIds = new Set<string>();
  const rooms: GroupedRoom[] = [];

  for (const player of players) {
    const childs = player.group_childs;
    if (childs && childs.length > 0) {
      const members = childs
        .map((id) => players.find((p) => p.player_id === id))
        .filter((p): p is MusicAssistantPlayer => p !== undefined);
      members.forEach((m) => memberIds.add(m.player_id));
      memberIds.add(player.player_id);
      rooms.push({ leader: player, members });
    }
  }

  const standalone = players.filter((p) => !memberIds.has(p.player_id));
  return { rooms, standalone };
}

function formatPlaybackState(state: string | undefined): string {
  if (!state) return "unknown";
  return state.replace(/_/g, " ");
}

export function RoomsList() {
  const { state, refresh } = useRealtimeSnapshot();
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);
  const [groupTarget, setGroupTarget] = useState<string | null>(null);
  const groupTargetRef = useRef(groupTarget);
  groupTargetRef.current = groupTarget;
  const players = state.players;
  const isLoading = state.status === "idle" || state.status === "loading";
  const errorMessage = actionErrorMessage ?? state.errorMessage;

  const runTransport = useCallback(
    async (playerId: string, command: "play" | "pause" | "next" | "previous") => {
      setActiveAction({ kind: "transport", playerId, command });
      setActionErrorMessage(null);
      setNowPlayingPreferredPlayer(playerId);
      try {
        await runWithRealtimeMutation(
          async () =>
            executeMusicAssistantCommand({
              command: `players/cmd/${command}`,
              args: { player_id: playerId },
            }),
          { playerId },
        );
      } catch (error) {
        setActionErrorMessage(
          error instanceof MusicAssistantCommandError
            ? error.message
            : "Unexpected error while executing command.",
        );
      } finally {
        setActiveAction(null);
      }
    },
    [],
  );

  const ungroupPlayer = useCallback(
    async (playerId: string) => {
      setActiveAction({ kind: "ungroup", playerId });
      setActionErrorMessage(null);
      setNowPlayingPreferredPlayer(playerId);
      try {
        await runWithRealtimeMutation(
          async () =>
            executeMusicAssistantCommand({
              command: "players/cmd/ungroup",
              args: { player_id: playerId },
            }),
          { playerId },
        );
      } catch (error) {
        setActionErrorMessage(
          error instanceof MusicAssistantCommandError
            ? error.message
            : "Unexpected error while ungrouping player.",
        );
      } finally {
        setActiveAction(null);
      }
    },
    [],
  );

  const groupPlayer = useCallback(
    async (memberId: string, targetId: string) => {
      setActiveAction({ kind: "group", targetId, memberId });
      setGroupTarget(null);
      setActionErrorMessage(null);
      setNowPlayingPreferredPlayer(targetId);
      try {
        await runWithRealtimeMutation(
          async () =>
            executeMusicAssistantCommand({
              command: "players/cmd/group",
              args: { player_id: memberId, target_player_id: targetId },
            }),
          { playerId: targetId },
        );
      } catch (error) {
        setActionErrorMessage(
          error instanceof MusicAssistantCommandError
            ? error.message
            : "Unexpected error while grouping players.",
        );
      } finally {
        setActiveAction(null);
      }
    },
    [],
  );

  const handleManualRefresh = useCallback(async () => {
    setActionErrorMessage(null);
    try {
      await refresh();
    } catch (error) {
      setActionErrorMessage(
        error instanceof MusicAssistantCommandError
          ? error.message
          : "Unexpected error while loading players.",
      );
    }
  }, [refresh]);

  const isBusy = activeAction !== null;

  const { rooms, standalone } = buildRooms(players);

  const renderRoomControls = (leader: MusicAssistantPlayer) => {
    const isPlaying = leader.playback_state === "playing";
    const supportsPause = leader.supported_features?.includes("pause") ?? false;
    const supportsNextPrevious = leader.supported_features?.includes("next_previous") ?? false;
    const isThisBusy =
      activeAction?.kind === "transport" && activeAction.playerId === leader.player_id;

    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Previous track"
          title={!supportsNextPrevious ? "Previous/next not supported for this group" : undefined}
          className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!leader.available || isBusy || !supportsNextPrevious}
          onClick={() => void runTransport(leader.player_id, "previous")}
        >
          Previous
        </button>
        <button
          type="button"
          aria-label={isPlaying ? "Pause group" : "Play group"}
          title={!supportsPause ? "Play/pause not supported for this group" : undefined}
          className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!leader.available || isBusy || !supportsPause}
          onClick={() => void runTransport(leader.player_id, isPlaying ? "pause" : "play")}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          aria-label="Next track"
          title={!supportsNextPrevious ? "Previous/next not supported for this group" : undefined}
          className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!leader.available || isBusy || !supportsNextPrevious}
          onClick={() => void runTransport(leader.player_id, "next")}
        >
          Next
        </button>
        {isThisBusy && <p className="text-xs text-foreground/70">Sending command…</p>}
        {!supportsPause && !supportsNextPrevious && (
          <p className="text-xs text-foreground/50">Playback controls not supported</p>
        )}
      </div>
    );
  };

  const renderGroups = () => {
    if (rooms.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-foreground/20 p-4">
          <p className="text-sm text-foreground/70">No active groups. Sync players below to create one.</p>
        </div>
      );
    }

    return (
      <ul className="flex flex-col gap-3">
        {rooms.map(({ leader, members }) => (
          <li
            key={leader.player_id}
            className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">{leader.name}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">
                  {leader.available ? formatPlaybackState(leader.playback_state) : "unavailable"}{" "}
                  · group leader
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isBusy}
                onClick={() => void ungroupPlayer(leader.player_id)}
              >
                {activeAction?.kind === "ungroup" && activeAction.playerId === leader.player_id
                  ? "Disbanding…"
                  : "Disband Group"}
              </button>
            </div>

            {renderRoomControls(leader)}

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-foreground/50">
                Members ({members.length})
              </p>
              <ul className="flex flex-col gap-2">
                {members.map((member) => (
                  <li
                    key={member.player_id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-foreground/10 px-3 py-2"
                  >
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-foreground/60">
                        {member.available ? "available" : "unavailable"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-foreground/15 px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() => void ungroupPlayer(member.player_id)}
                    >
                      {activeAction?.kind === "ungroup" &&
                      activeAction.playerId === member.player_id
                        ? "Removing…"
                        : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {leader.current_media?.title && (
              <p className="text-xs text-foreground/70">
                {leader.current_media.title}
                {leader.current_media.artist ? ` — ${leader.current_media.artist}` : ""}
              </p>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const renderStandalone = () => {
    if (standalone.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground/80">
          Standalone Players ({standalone.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {standalone.map((player) => {
            const supportsSync = player.supported_features?.includes("sync") ?? false;
            const isSelectingTarget = groupTarget !== null && groupTarget !== player.player_id;
            const isThisTarget = groupTarget === player.player_id;

            return (
              <li
                key={player.player_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">{player.name}</p>
                  <p className="text-xs text-foreground/60">
                    {player.available
                      ? formatPlaybackState(player.playback_state)
                      : "unavailable"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!supportsSync ? (
                    <span className="text-xs text-foreground/40">Sync not supported</span>
                  ) : isThisTarget ? (
                    <button
                      type="button"
                      className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setGroupTarget(null)}
                    >
                      Cancel
                    </button>
                  ) : isSelectingTarget ? (
                    <button
                      type="button"
                      className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy || !player.available}
                      onClick={() => {
                        if (groupTargetRef.current) {
                          void groupPlayer(player.player_id, groupTargetRef.current);
                        }
                      }}
                    >
                      {activeAction?.kind === "group" && activeAction.memberId === player.player_id
                        ? "Syncing…"
                        : `Sync to ${standalone.find((p) => p.player_id === groupTarget)?.name ?? "group"}`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy || !player.available || standalone.length < 2}
                      title={standalone.length < 2 ? "At least two players needed to sync" : undefined}
                      onClick={() => setGroupTarget(player.player_id)}
                    >
                      Sync with…
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {groupTarget !== null && (
          <p className="text-xs text-foreground/60">
            Select another player to sync with{" "}
            <strong className="font-medium">
              {standalone.find((p) => p.player_id === groupTarget)?.name}
            </strong>
            .
          </p>
        )}
      </div>
    );
  };

  const renderContent = () => {
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground/80">
            Active Groups ({rooms.length})
          </h2>
          {renderGroups()}
        </div>
        {renderStandalone()}
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-foreground/10 bg-background p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Rooms</h1>
          <p className="text-sm text-foreground/70">
            Group players into synchronized rooms and control multi-room playback.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading || isBusy}
          onClick={() => void handleManualRefresh()}
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
