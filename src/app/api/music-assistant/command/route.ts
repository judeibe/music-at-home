import { NextResponse } from "next/server";

import { MusicAssistantApiError } from "@/lib/music-assistant/errors";
import {
  executeAuthenticatedMusicAssistantCommand,
  withMusicAssistantAuth,
} from "@/lib/music-assistant/server";
import type { MusicAssistantCommandRequest } from "@/lib/music-assistant/types";

function isCommandRequest(value: unknown): value is MusicAssistantCommandRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as MusicAssistantCommandRequest;
  if (typeof payload.command !== "string" || payload.command.length === 0) {
    return false;
  }

  if (payload.args !== undefined && (payload.args === null || Array.isArray(payload.args))) {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  if (!isCommandRequest(body)) {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Expected payload: { command: string, args?: object }.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const data = await withMusicAssistantAuth(() =>
      executeAuthenticatedMusicAssistantCommand({
        command: body.command,
        args: body.args,
      }),
    );

    return NextResponse.json(
      {
        success: true,
        data,
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
          message: "Unexpected command execution error.",
        },
      },
      { status: 500 },
    );
  }
}
