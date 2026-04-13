"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  executeMusicAssistantCommand,
  MusicAssistantCommandError,
} from "@/lib/music-assistant/browser";
import type {
  MusicAssistantPlaybackState,
  MusicAssistantPlayer,
  MusicAssistantPlayerQueue,
  MusicAssistantQueueItem,
} from "@/lib/music-assistant/types";

const POLL_INTERVAL_MS = 12_000;
const QUEUE_ITEMS_LIMIT = 50;
const QUEUE_PREVIEW_COUNT = 5;

export type NowPlayingSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  activePlayer: MusicAssistantPlayer | null;
  activeQueue: MusicAssistantPlayerQueue | null;
  queuePreview: MusicAssistantQueueItem[];
  queueTotal: number | null;
  playbackState: MusicAssistantPlaybackState | null;
  elapsedSeconds: number | null;
  durationSeconds: number | null;
  errorMessage: string | null;
  lastUpdated: number | null;
};

const INITIAL_SNAPSHOT: NowPlayingSnapshot = {
  status: "idle",
  activePlayer: null,
  activeQueue: null,
  queuePreview: [],
  queueTotal: null,
  playbackState: null,
  elapsedSeconds: null,
  durationSeconds: null,
  errorMessage: null,
  lastUpdated: null,
};

let snapshot: NowPlayingSnapshot = INITIAL_SNAPSHOT;
let preferredPlayerId: string | null = null;
let refreshInFlight: Promise<void> | null = null;

const listeners = new Set<() => void>();

function publish(next: NowPlayingSnapshot) {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return INITIAL_SNAPSHOT;
}

function formatUnknownError(error: unknown): string {
  if (error instanceof MusicAssistantCommandError) {
    return error.message;
  }
  return "Unexpected error while loading now playing data.";
}

function pickActivePlayer(
  players: MusicAssistantPlayer[],
  preferredId: string | null,
): MusicAssistantPlayer | null {
  if (players.length === 0) {
    return null;
  }

  if (preferredId) {
    const preferred = players.find((player) => player.player_id === preferredId);
    if (preferred) {
      return preferred;
    }
  }

  const playing = players.find(
    (player) => player.available && player.playback_state === "playing",
  );
  if (playing) {
    return playing;
  }

  const active = players.find(
    (player) =>
      player.available &&
      (player.playback_state === "paused" || player.playback_state === "buffering"),
  );
  if (active) {
    return active;
  }

  const available = players.find((player) => player.available);
  return available ?? players[0] ?? null;
}

function pickActiveQueue(
  queues: MusicAssistantPlayerQueue[],
  playerId: string,
): MusicAssistantPlayerQueue | null {
  return (
    queues.find((queue) => queue.queue_id === playerId) ??
    queues.find((queue) => queue.active && queue.available) ??
    queues.find((queue) => queue.available) ??
    null
  );
}

function buildQueuePreview(
  items: MusicAssistantQueueItem[],
  currentIndex: number | null | undefined,
): MusicAssistantQueueItem[] {
  if (items.length === 0) {
    return [];
  }

  const start = currentIndex === null || currentIndex === undefined ? 0 : currentIndex + 1;
  return items.slice(start, start + QUEUE_PREVIEW_COUNT);
}

async function loadNowPlayingSnapshot(): Promise<void> {
  const [players, queues] = await Promise.all([
    executeMusicAssistantCommand<MusicAssistantPlayer[]>({
      command: "players/all",
      args: {},
    }),
    executeMusicAssistantCommand<MusicAssistantPlayerQueue[]>({
      command: "player_queues/all",
      args: {},
    }),
  ]);

  const playerList = Array.isArray(players) ? players : [];
  const queueList = Array.isArray(queues) ? queues : [];
  const activePlayer = pickActivePlayer(playerList, preferredPlayerId ?? snapshot.activePlayer?.player_id ?? null);

  if (!activePlayer) {
    publish({
      ...INITIAL_SNAPSHOT,
      status: "ready",
      lastUpdated: Date.now(),
    });
    return;
  }

  preferredPlayerId = activePlayer.player_id;
  const activeQueue = pickActiveQueue(queueList, activePlayer.player_id);

  const queueItems = activeQueue
    ? await executeMusicAssistantCommand<MusicAssistantQueueItem[]>({
        command: "player_queues/items",
        args: {
          queue_id: activeQueue.queue_id,
          limit: QUEUE_ITEMS_LIMIT,
          offset: 0,
        },
      })
    : [];

  const normalizedQueueItems = Array.isArray(queueItems) ? queueItems : [];
  const queuePreview = buildQueuePreview(normalizedQueueItems, activeQueue?.current_index);
  const elapsedSeconds = activeQueue?.elapsed_time ?? activePlayer.current_media?.elapsed_time ?? null;
  const durationSeconds =
    activePlayer.current_media?.duration ?? activeQueue?.current_item?.duration ?? null;

  publish({
    status: "ready",
    activePlayer,
    activeQueue,
    queuePreview,
    queueTotal: activeQueue?.items ?? null,
    playbackState: activePlayer.playback_state ?? activeQueue?.state ?? null,
    elapsedSeconds,
    durationSeconds,
    errorMessage: null,
    lastUpdated: Date.now(),
  });
}

export function setNowPlayingPreferredPlayer(playerId: string | null): void {
  preferredPlayerId = playerId;
}

export function requestNowPlayingRefresh(options?: {
  playerId?: string;
  withLoadingState?: boolean;
}): Promise<void> {
  if (options?.playerId) {
    preferredPlayerId = options.playerId;
  }

  if (options?.withLoadingState && snapshot.status === "idle") {
    publish({
      ...snapshot,
      status: "loading",
      errorMessage: null,
    });
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      await loadNowPlayingSnapshot();
    } catch (error) {
      publish({
        ...snapshot,
        status: "error",
        errorMessage: formatUnknownError(error),
        lastUpdated: Date.now(),
      });
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export function useNowPlayingSnapshot() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (getSnapshot().status === "idle") {
      void requestNowPlayingRefresh({ withLoadingState: true });
    }

    const intervalId = window.setInterval(() => {
      void requestNowPlayingRefresh();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const refresh = useCallback(
    async (options?: { playerId?: string }) => {
      await requestNowPlayingRefresh(options);
    },
    [],
  );

  return { state, refresh };
}

export function __resetNowPlayingStateForTests() {
  snapshot = INITIAL_SNAPSHOT;
  preferredPlayerId = null;
  refreshInFlight = null;
  listeners.clear();
}
