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
  | "sync"
  | (string & {});

export type MusicAssistantPlayerType = "player" | "group" | "sync_group" | (string & {});

export type MusicAssistantPlayerMedia = {
  uri?: string | null;
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  image_url?: string | null;
  duration?: number | null;
  elapsed_time?: number | null;
  elapsed_time_last_updated?: number | null;
  queue_item_id?: string | null;
};

export type MusicAssistantPlayer = {
  player_id: string;
  provider: string;
  name: string;
  available: boolean;
  type?: MusicAssistantPlayerType;
  playback_state?: MusicAssistantPlaybackState;
  supported_features?: MusicAssistantPlayerFeature[];
  current_media?: MusicAssistantPlayerMedia | null;
  /** Volume level 0–100, if supported */
  volume_level?: number | null;
  /** Whether the player is muted, if supported */
  volume_muted?: boolean | null;
  /** IDs of child players in a sync group (present when this player is the group leader) */
  group_childs?: string[] | null;
};

export type MusicAssistantQueueItem = {
  queue_id: string;
  queue_item_id: string;
  name: string;
  duration?: number | null;
  index?: number;
  available?: boolean;
};

export type MusicAssistantPlayerQueue = {
  queue_id: string;
  active: boolean;
  display_name: string;
  available: boolean;
  items: number;
  current_index?: number | null;
  elapsed_time?: number;
  elapsed_time_last_updated?: number;
  state?: MusicAssistantPlaybackState;
  current_item?: MusicAssistantQueueItem | null;
  next_item?: MusicAssistantQueueItem | null;
};
