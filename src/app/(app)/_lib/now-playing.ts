"use client";

import { useMemo } from "react";

import type {
  MusicAssistantPlaybackState,
  MusicAssistantQueueItem,
} from "@/lib/music-assistant/types";

import {
  __resetRealtimeStateForTests,
  requestRealtimeRefresh,
  setRealtimePreferredPlayer,
  useRealtimeSnapshot,
} from "./realtime-state";

export type NowPlayingSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  activePlayer: ReturnType<typeof useRealtimeSnapshot>["state"]["activePlayer"];
  activeQueue: ReturnType<typeof useRealtimeSnapshot>["state"]["activeQueue"];
  queuePreview: MusicAssistantQueueItem[];
  queueTotal: number | null;
  playbackState: MusicAssistantPlaybackState | null;
  elapsedSeconds: number | null;
  durationSeconds: number | null;
  errorMessage: string | null;
  lastUpdated: number | null;
};

export function setNowPlayingPreferredPlayer(playerId: string | null): void {
  setRealtimePreferredPlayer(playerId);
}

export function requestNowPlayingRefresh(options?: {
  playerId?: string;
  withLoadingState?: boolean;
}): Promise<void> {
  return requestRealtimeRefresh({
    playerId: options?.playerId,
    withLoadingState: options?.withLoadingState,
    reason: options?.withLoadingState ? "initial" : "manual",
  });
}

export function useNowPlayingSnapshot() {
  const { state, refresh } = useRealtimeSnapshot();
  const nowPlayingState = useMemo<NowPlayingSnapshot>(
    () => ({
      status: state.status,
      activePlayer: state.activePlayer,
      activeQueue: state.activeQueue,
      queuePreview: state.queuePreview,
      queueTotal: state.queueTotal,
      playbackState: state.playbackState,
      elapsedSeconds: state.elapsedSeconds,
      durationSeconds: state.durationSeconds,
      errorMessage: state.errorMessage,
      lastUpdated: state.lastUpdated,
    }),
    [state],
  );

  return { state: nowPlayingState, refresh };
}

export function __resetNowPlayingStateForTests() {
  __resetRealtimeStateForTests();
}
