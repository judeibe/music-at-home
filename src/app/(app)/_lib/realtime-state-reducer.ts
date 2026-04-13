import type {
  MusicAssistantPlaybackState,
  MusicAssistantPlayer,
  MusicAssistantPlayerQueue,
  MusicAssistantQueueItem,
} from "@/lib/music-assistant/types";

export type RealtimeMode = "polling" | "websocket";

export type RealtimeSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  players: MusicAssistantPlayer[];
  queues: MusicAssistantPlayerQueue[];
  activePlayer: MusicAssistantPlayer | null;
  activeQueue: MusicAssistantPlayerQueue | null;
  queuePreview: MusicAssistantQueueItem[];
  queueTotal: number | null;
  playbackState: MusicAssistantPlaybackState | null;
  elapsedSeconds: number | null;
  durationSeconds: number | null;
  errorMessage: string | null;
  lastUpdated: number | null;
  mode: RealtimeMode;
  latestRequestId: number;
};

export type RealtimeRefreshPayload = {
  players: MusicAssistantPlayer[];
  queues: MusicAssistantPlayerQueue[];
  activePlayer: MusicAssistantPlayer | null;
  activeQueue: MusicAssistantPlayerQueue | null;
  queuePreview: MusicAssistantQueueItem[];
  queueTotal: number | null;
  playbackState: MusicAssistantPlaybackState | null;
  elapsedSeconds: number | null;
  durationSeconds: number | null;
};

export type RealtimeAction =
  | {
      type: "refresh-requested";
      requestId: number;
      withLoadingState: boolean;
    }
  | {
      type: "refresh-succeeded";
      requestId: number;
      payload: RealtimeRefreshPayload;
      updatedAt: number;
    }
  | {
      type: "refresh-failed";
      requestId: number;
      errorMessage: string;
      updatedAt: number;
    }
  | {
      type: "mode-updated";
      mode: RealtimeMode;
    };

export const INITIAL_REALTIME_SNAPSHOT: RealtimeSnapshot = {
  status: "idle",
  players: [],
  queues: [],
  activePlayer: null,
  activeQueue: null,
  queuePreview: [],
  queueTotal: null,
  playbackState: null,
  elapsedSeconds: null,
  durationSeconds: null,
  errorMessage: null,
  lastUpdated: null,
  mode: "polling",
  latestRequestId: 0,
};

export function realtimeStateReducer(
  state: RealtimeSnapshot,
  action: RealtimeAction,
): RealtimeSnapshot {
  if (action.type === "mode-updated") {
    if (state.mode === action.mode) {
      return state;
    }
    return {
      ...state,
      mode: action.mode,
    };
  }

  if (action.requestId < state.latestRequestId) {
    return state;
  }

  if (action.type === "refresh-requested") {
    return {
      ...state,
      latestRequestId: action.requestId,
      status:
        action.withLoadingState &&
        (state.status === "idle" || state.status === "error")
          ? "loading"
          : state.status,
      errorMessage: null,
    };
  }

  if (action.type === "refresh-failed") {
    return {
      ...state,
      latestRequestId: action.requestId,
      status: "error",
      errorMessage: action.errorMessage,
      lastUpdated: action.updatedAt,
    };
  }

  return {
    ...state,
    ...action.payload,
    latestRequestId: action.requestId,
    status: "ready",
    errorMessage: null,
    lastUpdated: action.updatedAt,
  };
}
