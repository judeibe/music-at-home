export type MusicAssistantJson = Record<string, unknown>;

export type MusicAssistantCommandArgs = Record<string, unknown>;

export type MusicAssistantCommandResult = unknown;

export type MusicAssistantCommandRequest = {
  command: string;
  args?: MusicAssistantCommandArgs;
};

export type MusicAssistantCredentials = {
  username: string;
  password: string;
};

export type MusicAssistantLoginRequest = {
  provider_id?: string;
  credentials: MusicAssistantCredentials;
};

export type MusicAssistantUserRole = "admin" | "user" | "guest";

export type MusicAssistantUser = {
  user_id: string;
  username: string;
  role: MusicAssistantUserRole;
  display_name?: string | null;
  avatar_url?: string | null;
  enabled?: boolean;
  created_at?: string;
  provider_filter?: string[];
  player_filter?: string[];
  preferences?: Record<string, unknown>;
};

export type MusicAssistantAuthResponse = {
  success: boolean;
  token: string;
  user: MusicAssistantUser;
};

export type MusicAssistantAuthProvider = Record<string, unknown>;

export type MusicAssistantAuthProvidersResponse = {
  providers: MusicAssistantAuthProvider[];
};

export type MusicAssistantServerInfo = {
  schema_version: number;
  server_version: string;
  onboard_done: boolean;
  homeassistant_addon: boolean;
};

export type MusicAssistantPlaybackState =
  | "idle"
  | "playing"
  | "paused"
  | "buffering"
  | (string & {});

export type MusicAssistantPlayerFeature =
  | "pause"
  | "next_previous"
  | "power"
  | "volume_set"
  | "volume_mute"
  | (string & {});

export type MusicAssistantPlayerMedia = {
  title?: string | null;
  artist?: string | null;
  album?: string | null;
};

export type MusicAssistantPlayer = {
  player_id: string;
  provider: string;
  name: string;
  available: boolean;
  playback_state?: MusicAssistantPlaybackState;
  supported_features?: MusicAssistantPlayerFeature[];
  current_media?: MusicAssistantPlayerMedia | null;
};
