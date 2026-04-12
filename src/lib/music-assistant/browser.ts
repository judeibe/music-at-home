import type { MusicAssistantCommandRequest } from "@/lib/music-assistant/types";

type CommandSuccessResponse<TResult> = {
  success: true;
  data: TResult;
};

type CommandErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

function readErrorPayload(
  payload: CommandSuccessResponse<unknown> | CommandErrorResponse | null,
): CommandErrorResponse["error"] | undefined {
  if (!payload || !("error" in payload)) {
    return undefined;
  }
  return payload.error;
}

export class MusicAssistantCommandError extends Error {
  public readonly code: string;
  public readonly status: number;

  public constructor(params: { message: string; code?: string; status: number }) {
    super(params.message);
    this.name = "MusicAssistantCommandError";
    this.code = params.code ?? "UNKNOWN_ERROR";
    this.status = params.status;
  }
}

export async function executeMusicAssistantCommand<TResult = unknown>(
  request: MusicAssistantCommandRequest,
): Promise<TResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10_000);

  let response: Response;

  try {
    response = await fetch("/api/music-assistant/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new MusicAssistantCommandError({
        code: "TIMEOUT",
        message: "Music Assistant request timed out.",
        status: 408,
      });
    }

    throw new MusicAssistantCommandError({
      code: "NETWORK_ERROR",
      message: "Unable to reach Music Assistant API.",
      status: 0,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = (await response.json().catch(() => null)) as
    | CommandSuccessResponse<TResult>
    | CommandErrorResponse
    | null;

  if (!response.ok) {
    const errorPayload = readErrorPayload(
      payload as CommandSuccessResponse<unknown> | CommandErrorResponse | null,
    );
    throw new MusicAssistantCommandError({
      code: errorPayload?.code ?? "COMMAND_FAILED",
      message: errorPayload?.message ?? "Music Assistant command failed.",
      status: response.status,
    });
  }

  if (!payload || !("success" in payload) || payload.success !== true) {
    throw new MusicAssistantCommandError({
      code: "INVALID_RESPONSE",
      message: "Unexpected command response payload.",
      status: response.status,
    });
  }

  return payload.data;
}
