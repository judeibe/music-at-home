import "server-only";

import { cookies } from "next/headers";

export const MUSIC_ASSISTANT_SESSION_COOKIE = "music_assistant_session";

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_SESSION = 7;
const SESSION_MAX_AGE_SECONDS =
  SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY * DAYS_PER_SESSION;

export async function setMusicAssistantSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MUSIC_ASSISTANT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearMusicAssistantSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MUSIC_ASSISTANT_SESSION_COOKIE);
}

export async function getMusicAssistantSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(MUSIC_ASSISTANT_SESSION_COOKIE)?.value ?? null;
}
