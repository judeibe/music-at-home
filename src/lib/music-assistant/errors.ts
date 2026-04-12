type MusicAssistantApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export class MusicAssistantApiError extends Error {
  public readonly status?: number;
  public readonly code: MusicAssistantApiErrorCode;
  public readonly details?: unknown;

  public constructor(params: {
    message: string;
    code: MusicAssistantApiErrorCode;
    status?: number;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "MusicAssistantApiError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

function mapHttpStatusToCode(status: number): MusicAssistantApiErrorCode {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    default:
      if (status >= 500) {
        return "SERVER_ERROR";
      }
      return "UNKNOWN_ERROR";
  }
}

function pickMessage(status: number, details: unknown): string {
  if (details && typeof details === "object") {
    const payload = details as Record<string, unknown>;
    const candidates = [payload.message, payload.error, payload.detail];
    const firstText = candidates.find((value) => typeof value === "string");
    if (typeof firstText === "string" && firstText.length > 0) {
      return firstText;
    }
  }

  switch (status) {
    case 400:
      return "Music Assistant request is invalid.";
    case 401:
      return "Music Assistant authentication is required.";
    case 403:
      return "Music Assistant access is forbidden.";
    default:
      if (status >= 500) {
        return "Music Assistant server encountered an error.";
      }
      return `Music Assistant request failed with status ${status}.`;
  }
}

export function createMusicAssistantApiError(params: {
  status: number;
  details?: unknown;
}): MusicAssistantApiError {
  return new MusicAssistantApiError({
    status: params.status,
    code: mapHttpStatusToCode(params.status),
    message: pickMessage(params.status, params.details),
    details: params.details,
  });
}

export function createMusicAssistantNetworkError(cause: unknown): MusicAssistantApiError {
  return new MusicAssistantApiError({
    code: "NETWORK_ERROR",
    message: "Failed to reach Music Assistant server.",
    details: cause,
  });
}
