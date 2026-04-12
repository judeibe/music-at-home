import "server-only";

import { MusicAssistantApiClient } from "@/lib/music-assistant/client";
import { MusicAssistantApiError } from "@/lib/music-assistant/errors";
import {
  clearMusicAssistantSession,
  getMusicAssistantSessionToken,
  setMusicAssistantSession,
} from "@/lib/music-assistant/session";
import type { MusicAssistantCommandRequest } from "@/lib/music-assistant/types";

const DEFAULT_BASE_URL = "http://localhost:8095";

let cachedClient: MusicAssistantApiClient | null = null;

export function getMusicAssistantClient(): MusicAssistantApiClient {
  if (cachedClient) {
    return cachedClient;
  }

  const baseUrl = process.env.MUSIC_ASSISTANT_BASE_URL ?? DEFAULT_BASE_URL;
  cachedClient = new MusicAssistantApiClient({ baseUrl });
  return cachedClient;
}

export async function loginMusicAssistantSession(params: {
  username: string;
  password: string;
  providerId?: string;
}) {
  const result = await getMusicAssistantClient().login(params);
  await setMusicAssistantSession(result.token);
  return result.user;
}

export async function executeAuthenticatedMusicAssistantCommand<TResult = unknown>(
  request: MusicAssistantCommandRequest,
): Promise<TResult> {
  const token = await getMusicAssistantSessionToken();
  if (!token) {
    throw new MusicAssistantApiError({
      code: "UNAUTHORIZED",
      message: "Music Assistant session token is missing.",
      status: 401,
    });
  }

  const response = await getMusicAssistantClient().executeCommand<TResult>(request, {
    token,
  });
  return response;
}

export async function logoutMusicAssistantSession(): Promise<void> {
  await clearMusicAssistantSession();
}

export async function withMusicAssistantAuth<TResult>(
  operation: () => Promise<TResult>,
): Promise<TResult> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof MusicAssistantApiError && error.status === 401) {
      await clearMusicAssistantSession();
    }
    throw error;
  }
}
