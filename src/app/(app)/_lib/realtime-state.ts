"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  executeMusicAssistantCommand,
  MusicAssistantCommandError,
} from "@/lib/music-assistant/browser";
import type {
  MusicAssistantPlayer,
  MusicAssistantPlayerQueue,
  MusicAssistantQueueItem,
} from "@/lib/music-assistant/types";

import {
  INITIAL_REALTIME_SNAPSHOT,
  realtimeStateReducer,
  type RealtimeRefreshPayload,
  type RealtimeSnapshot,
} from "./realtime-state-reducer";

const POLL_INTERVAL_MS = 12_000;
const QUEUE_ITEMS_LIMIT = 50;
const QUEUE_PREVIEW_COUNT = 5;
const WEBSOCKET_RETRY_MS = 5_000;
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_MUSIC_ASSISTANT_WS_URL?.trim() ?? "";

type RealtimeRefreshReason = "initial" | "manual" | "background" | "event" | "mutation";

type RequestRealtimeRefreshOptions = {
  playerId?: string;
  withLoadingState?: boolean;
  reason?: RealtimeRefreshReason;
  force?: boolean;
};

let snapshot: RealtimeSnapshot = INITIAL_REALTIME_SNAPSHOT;
let preferredPlayerId: string | null = null;
let refreshInFlight:
  | {
      requestId: number;
      promise: Promise<void>;
    }
  | null = null;
let nextRequestId = 0;
let ignoreRequestsThroughId = 0;
let activeMutations = 0;
let pendingDeferredRefresh = false;
let pollIntervalId: number | null = null;
let websocket: WebSocket | null = null;
let websocketRetryTimeoutId: number | null = null;

const listeners = new Set<() => void>();

function publish(next: RealtimeSnapshot) {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

function dispatch(action: Parameters<typeof realtimeStateReducer>[1]) {
  publish(realtimeStateReducer(snapshot, action));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    startRealtimeUpdates();
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopRealtimeUpdates();
    }
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return INITIAL_REALTIME_SNAPSHOT;
}

function formatUnknownError(error: unknown): string {
  if (error instanceof MusicAssistantCommandError) {
    return error.message;
  }
  return "Unexpected error while loading realtime player data.";
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

async function loadRealtimePayload(): Promise<RealtimeRefreshPayload> {
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

  const activePlayer = pickActivePlayer(
    playerList,
    preferredPlayerId ?? snapshot.activePlayer?.player_id ?? null,
  );

  if (!activePlayer) {
    return {
      players: playerList,
      queues: queueList,
      activePlayer: null,
      activeQueue: null,
      queuePreview: [],
      queueTotal: null,
      playbackState: null,
      elapsedSeconds: null,
      durationSeconds: null,
    };
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
  const elapsedSeconds =
    activeQueue?.elapsed_time ?? activePlayer.current_media?.elapsed_time ?? null;
  const durationSeconds =
    activePlayer.current_media?.duration ?? activeQueue?.current_item?.duration ?? null;

  return {
    players: playerList,
    queues: queueList,
    activePlayer,
    activeQueue,
    queuePreview,
    queueTotal: activeQueue?.items ?? null,
    playbackState: activePlayer.playback_state ?? activeQueue?.state ?? null,
    elapsedSeconds,
    durationSeconds,
  };
}

function scheduleDeferredRefresh() {
  if (activeMutations !== 0 || !pendingDeferredRefresh) {
    return;
  }

  pendingDeferredRefresh = false;
  void requestRealtimeRefresh({
    reason: "background",
    withLoadingState: false,
  });
}

function shouldDeferRefresh(options: RequestRealtimeRefreshOptions): boolean {
  if (options.force) {
    return false;
  }

  if (activeMutations === 0) {
    return false;
  }

  return options.reason !== "mutation";
}

function connectWebsocket() {
  if (typeof window === "undefined" || !WEBSOCKET_URL || listeners.size === 0) {
    return;
  }

  const socket = new WebSocket(WEBSOCKET_URL);
  websocket = socket;

  socket.addEventListener("open", () => {
    dispatch({ type: "mode-updated", mode: "websocket" });
  });

  socket.addEventListener("message", () => {
    void requestRealtimeRefresh({
      reason: "event",
      withLoadingState: false,
    });
  });

  socket.addEventListener("error", () => {
    dispatch({ type: "mode-updated", mode: "polling" });
  });

  socket.addEventListener("close", () => {
    if (websocket === socket) {
      websocket = null;
    }

    dispatch({ type: "mode-updated", mode: "polling" });

    if (listeners.size === 0) {
      return;
    }

    if (websocketRetryTimeoutId !== null) {
      window.clearTimeout(websocketRetryTimeoutId);
    }
    websocketRetryTimeoutId = window.setTimeout(() => {
      websocketRetryTimeoutId = null;
      connectWebsocket();
    }, WEBSOCKET_RETRY_MS);
  });
}

function startRealtimeUpdates() {
  if (snapshot.status === "idle") {
    void requestRealtimeRefresh({
      withLoadingState: true,
      reason: "initial",
    });
  }

  if (pollIntervalId === null) {
    pollIntervalId = window.setInterval(() => {
      void requestRealtimeRefresh({
        reason: "background",
        withLoadingState: false,
      });
    }, POLL_INTERVAL_MS);
  }

  if (!websocket) {
    connectWebsocket();
  }
}

function stopRealtimeUpdates() {
  if (pollIntervalId !== null) {
    window.clearInterval(pollIntervalId);
    pollIntervalId = null;
  }

  if (websocketRetryTimeoutId !== null) {
    window.clearTimeout(websocketRetryTimeoutId);
    websocketRetryTimeoutId = null;
  }

  if (websocket) {
    websocket.close();
    websocket = null;
  }
}

export function setRealtimePreferredPlayer(playerId: string | null): void {
  preferredPlayerId = playerId;
}

export function requestRealtimeRefresh(
  options: RequestRealtimeRefreshOptions = {},
): Promise<void> {
  if (options.playerId) {
    preferredPlayerId = options.playerId;
  }

  if (shouldDeferRefresh(options)) {
    pendingDeferredRefresh = true;
    return refreshInFlight?.promise ?? Promise.resolve();
  }

  if (refreshInFlight) {
    return refreshInFlight.promise;
  }

  const requestId = ++nextRequestId;
  dispatch({
    type: "refresh-requested",
    requestId,
    withLoadingState: options.withLoadingState ?? false,
  });

  const refreshPromise = (async () => {
    try {
      const payload = await loadRealtimePayload();
      if (requestId <= ignoreRequestsThroughId) {
        return;
      }

      dispatch({
        type: "refresh-succeeded",
        requestId,
        payload,
        updatedAt: Date.now(),
      });
    } catch (error) {
      if (requestId <= ignoreRequestsThroughId) {
        return;
      }

      dispatch({
        type: "refresh-failed",
        requestId,
        errorMessage: formatUnknownError(error),
        updatedAt: Date.now(),
      });
    } finally {
      refreshInFlight = null;
      scheduleDeferredRefresh();
    }
  })();

  refreshInFlight = {
    requestId,
    promise: refreshPromise,
  };

  return refreshPromise;
}

export async function runWithRealtimeMutation<TResult>(
  mutation: () => Promise<TResult>,
  options: { playerId?: string } = {},
): Promise<TResult> {
  activeMutations += 1;
  ignoreRequestsThroughId = Math.max(ignoreRequestsThroughId, nextRequestId);
  if (options.playerId) {
    preferredPlayerId = options.playerId;
  }

  try {
    const result = await mutation();
    await requestRealtimeRefresh({
      playerId: options.playerId,
      reason: "mutation",
      withLoadingState: false,
      force: true,
    });
    return result;
  } finally {
    activeMutations = Math.max(0, activeMutations - 1);
    scheduleDeferredRefresh();
  }
}

export function useRealtimeSnapshot() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const refresh = useCallback(
    async (options?: { playerId?: string }) => {
      await requestRealtimeRefresh({
        playerId: options?.playerId,
        reason: "manual",
      });
    },
    [],
  );

  useEffect(() => {
    if (snapshot.status === "idle") {
      void requestRealtimeRefresh({
        withLoadingState: true,
        reason: "initial",
      });
    }
  }, []);

  return { state, refresh };
}

export function __resetRealtimeStateForTests() {
  stopRealtimeUpdates();
  snapshot = INITIAL_REALTIME_SNAPSHOT;
  preferredPlayerId = null;
  refreshInFlight = null;
  nextRequestId = 0;
  ignoreRequestsThroughId = 0;
  activeMutations = 0;
  pendingDeferredRefresh = false;
  listeners.clear();
}
