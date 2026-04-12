import {
  createMusicAssistantApiError,
  createMusicAssistantNetworkError,
  MusicAssistantApiError,
} from "@/lib/music-assistant/errors";
import type {
  MusicAssistantAuthProvidersResponse,
  MusicAssistantAuthResponse,
  MusicAssistantCommandRequest,
  MusicAssistantServerInfo,
} from "@/lib/music-assistant/types";

type RequestOptions = {
  token?: string;
};

type FetchLike = typeof fetch;

export class MusicAssistantApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: FetchLike;

  public constructor(params: { baseUrl: string; fetcher?: FetchLike }) {
    this.baseUrl = params.baseUrl.replace(/\/$/, "");
    this.fetcher = params.fetcher ?? fetch;
  }

  public async getInfo(): Promise<MusicAssistantServerInfo> {
    return this.requestJson<MusicAssistantServerInfo>("/info", {
      method: "GET",
    });
  }

  public async getAuthProviders(): Promise<MusicAssistantAuthProvidersResponse> {
    return this.requestJson<MusicAssistantAuthProvidersResponse>("/auth/providers", {
      method: "GET",
    });
  }

  public async login(params: {
    username: string;
    password: string;
    providerId?: string;
  }): Promise<MusicAssistantAuthResponse> {
    return this.requestJson<MusicAssistantAuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        provider_id: params.providerId ?? "builtin",
        credentials: {
          username: params.username,
          password: params.password,
        },
      }),
    });
  }

  public async executeCommand<TResult = unknown>(
    request: MusicAssistantCommandRequest,
    options: RequestOptions,
  ): Promise<TResult> {
    if (!options.token) {
      throw new MusicAssistantApiError({
        code: "UNAUTHORIZED",
        message: "Music Assistant session token is missing.",
        status: 401,
      });
    }

    return this.requestJson<TResult>(
      "/api",
      {
        method: "POST",
        body: JSON.stringify({
          command: request.command,
          args: request.args ?? {},
        }),
      },
      { token: options.token },
    );
  }

  private async requestJson<T>(
    path: string,
    init: RequestInit,
    options: RequestOptions = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");

    if (options.token) {
      headers.set("Authorization", `Bearer ${options.token}`);
    }

    let response: Response;
    try {
      response = await this.fetcher(`${this.baseUrl}${path}`, {
        ...init,
        headers,
      });
    } catch (error) {
      throw createMusicAssistantNetworkError(error);
    }

    const details = await this.parseJson(response);
    if (!response.ok) {
      throw createMusicAssistantApiError({
        status: response.status,
        details,
      });
    }

    return details as T;
  }

  private async parseJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
}
