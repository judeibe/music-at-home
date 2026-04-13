import { describe, expect, it } from "vitest";

import {
  INITIAL_REALTIME_SNAPSHOT,
  realtimeStateReducer,
} from "../realtime-state-reducer";

describe("realtimeStateReducer", () => {
  it("updates mode independently of refresh lifecycle", () => {
    const next = realtimeStateReducer(INITIAL_REALTIME_SNAPSHOT, {
      type: "mode-updated",
      mode: "websocket",
    });

    expect(next.mode).toBe("websocket");
    expect(next.status).toBe("idle");
  });

  it("ignores stale refresh success payloads", () => {
    const requested = realtimeStateReducer(INITIAL_REALTIME_SNAPSHOT, {
      type: "refresh-requested",
      requestId: 3,
      withLoadingState: true,
    });

    const stale = realtimeStateReducer(requested, {
      type: "refresh-succeeded",
      requestId: 2,
      payload: {
        players: [
          {
            player_id: "stale",
            provider: "test",
            name: "Stale Player",
            available: false,
          },
        ],
        queues: [],
        activePlayer: null,
        activeQueue: null,
        queuePreview: [],
        queueTotal: null,
        playbackState: null,
        elapsedSeconds: null,
        durationSeconds: null,
      },
      updatedAt: 1,
    });

    expect(stale).toBe(requested);
  });

  it("transitions to ready with latest refresh data", () => {
    const requested = realtimeStateReducer(INITIAL_REALTIME_SNAPSHOT, {
      type: "refresh-requested",
      requestId: 1,
      withLoadingState: true,
    });

    const ready = realtimeStateReducer(requested, {
      type: "refresh-succeeded",
      requestId: 1,
      payload: {
        players: [
          {
            player_id: "player-1",
            provider: "test",
            name: "Living Room",
            available: true,
          },
        ],
        queues: [
          {
            queue_id: "player-1",
            active: true,
            display_name: "Living Room",
            available: true,
            items: 1,
          },
        ],
        activePlayer: {
          player_id: "player-1",
          provider: "test",
          name: "Living Room",
          available: true,
        },
        activeQueue: {
          queue_id: "player-1",
          active: true,
          display_name: "Living Room",
          available: true,
          items: 1,
        },
        queuePreview: [
          {
            queue_id: "player-1",
            queue_item_id: "item-1",
            name: "Song A",
          },
        ],
        queueTotal: 1,
        playbackState: "playing",
        elapsedSeconds: 30,
        durationSeconds: 120,
      },
      updatedAt: 123,
    });

    expect(ready.status).toBe("ready");
    expect(ready.players).toHaveLength(1);
    expect(ready.activePlayer?.player_id).toBe("player-1");
    expect(ready.queuePreview[0]?.name).toBe("Song A");
    expect(ready.lastUpdated).toBe(123);
  });
});
