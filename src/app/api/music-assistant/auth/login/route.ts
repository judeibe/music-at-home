import { NextResponse } from "next/server";

import { MusicAssistantApiError } from "@/lib/music-assistant/errors";
import { loginMusicAssistantSession, withMusicAssistantAuth } from "@/lib/music-assistant/server";

type LoginPayload = {
  username: string;
  password: string;
  providerId?: string;
};

function isValidLoginPayload(value: unknown): value is LoginPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as LoginPayload;
  return typeof payload.username === "string" && typeof payload.password === "string";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Invalid JSON in request body.",
        },
      },
      { status: 400 },
    );
  }

  if (!isValidLoginPayload(body)) {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Expected username and password.",
        },
      },
      { status: 400 },
    );
  }
  const payload = body;

  try {
    const user = await withMusicAssistantAuth(() =>
      loginMusicAssistantSession({
        username: payload.username,
        password: payload.password,
        providerId: payload.providerId,
      }),
    );

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof MusicAssistantApiError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status ?? 500 },
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "UNKNOWN_ERROR",
          message: "Unexpected authentication error.",
        },
      },
      { status: 500 },
    );
  }
}
