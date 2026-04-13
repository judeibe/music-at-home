"use client";

import { useState } from "react";

import { executeMusicAssistantCommand } from "@/lib/music-assistant/browser";

import {
  setNowPlayingPreferredPlayer,
  useNowPlayingSnapshot,
} from "../_lib/now-playing";
import { runWithRealtimeMutation } from "../_lib/realtime-state";

export function NowPlayingBar() {
  const { state } = useNowPlayingSnapshot();
  const [isWorking, setIsWorking] = useState(false);

  const player = state.activePlayer;
  const title = player?.current_media?.title?.trim() || null;
  const artist = player?.current_media?.artist?.trim() || null;
  const isPlaying = state.playbackState === "playing";
  const canPause = player?.supported_features?.includes("pause") ?? false;

  async function togglePlayPause() {
    if (!player?.player_id || !canPause) return;
    setIsWorking(true);
    setNowPlayingPreferredPlayer(player.player_id);
    try {
      await runWithRealtimeMutation(
        async () =>
          executeMusicAssistantCommand({
            command: `players/cmd/${isPlaying ? "pause" : "play"}`,
            args: { player_id: player.player_id },
          }),
        { playerId: player.player_id },
      );
    } catch {
      // silent fail in mini bar
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div
      className="flex items-center gap-3 px-4"
      style={{
        height: "var(--now-playing-height)",
        background: "color-mix(in srgb, var(--bg-sidebar) 94%, transparent)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Artwork */}
      <div
        className="shrink-0 rounded-md"
        style={{
          width: 44,
          height: 44,
          background: title
            ? "linear-gradient(135deg, var(--accent) 0%, #ff6b6b 100%)"
            : "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: title ? "var(--shadow-md)" : "none",
        }}
        aria-hidden="true"
      >
        {title ? (
          <svg viewBox="0 0 16 16" fill="white" style={{ width: 16, height: 16, opacity: 0.8 }}>
            <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11v7.78a1.5 1.5 0 0 0 2.3 1.269l5.344-3.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14, color: "var(--fg-tertiary)" }}>
            <path d="M8 1a1 1 0 0 1 1 1v5.268l3.528-2.036a1 1 0 1 1 1 1.732L10 9l3.528 2.036a1 1 0 1 1-1 1.732L9 10.732V16a1 1 0 1 1-2 0v-5.268L3.472 12.768a1 1 0 1 1-1-1.732L5.999 9.03 2.472 6.994a1 1 0 0 1 1-1.732L7 7.268V2a1 1 0 0 1 1-1Z" />
          </svg>
        )}
      </div>

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-semibold leading-snug"
          style={{ color: "var(--foreground)" }}
        >
          {title ?? "Not playing"}
        </p>
        <p
          className="truncate text-xs leading-snug"
          style={{ color: "var(--fg-secondary)" }}
        >
          {artist ?? (player?.name ?? "No player active")}
        </p>
      </div>

      {/* Play / Pause */}
      <button
        type="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        disabled={!player?.available || !canPause || isWorking}
        onClick={() => void togglePlayPause()}
        className="flex size-10 shrink-0 items-center justify-center rounded-full am-transition disabled:opacity-40"
        style={{ background: "var(--accent)", color: "#ffffff" }}
      >
        {isPlaying ? (
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }} aria-hidden="true">
            <path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }} aria-hidden="true">
            <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
