import { User } from "..";

export interface RoomSettings {
    maxPlayers?: number;
    pauseTimeoutSeconds?: number;
}

export interface GameSettings {
    // Dominoes settings
    winTarget?: number;
    drawFromBoneyard?: boolean;
    // Spades settings
    allowNil?: boolean;
    blindNilEnabled?: boolean;
    bagsPenalty?: number;
}

export type LobbyData = {
    code: string;
    name: string;
    createdAt: string;
    state: string;
    readyStates: Record<string, boolean>;
    roomId: string;
    users: User[];
    leaderId: string;
    selectedGameType: string;
    teams?: string[][]; // Optional, only if game requires teams
    settings?: RoomSettings; // Room-level settings
    gameSettings?: GameSettings; // Game-specific settings
    isPaused?: boolean; // Track if game is paused due to disconnections
    pausedAt?: string; // ISO timestamp when game was paused
    spectators?: string[]; // User IDs of spectators
};

export type BaseRoomEvent = {
    event: string;
    roomState: LobbyData;
    timestamp: string;
};

export type RoomEventPayload =
    | (BaseRoomEvent & { event: "sync" })
    | (BaseRoomEvent & {
          event: "user_joined";
          userName: string;
          isSpectator?: boolean;
      })
    | (BaseRoomEvent & {
          event: "user_left";
          userName: string;
          voluntary?: boolean;
      })
    | (BaseRoomEvent & {
          event: "game_started";
          gameId: string;
          gameState: object;
          gameType: string;
      })
    | (BaseRoomEvent & { event: "room_closed" })
    | (BaseRoomEvent & {
          event: "user_disconnected";
          userName?: string;
          userId: string;
      })
    | (BaseRoomEvent & {
          event: "user_reconnected";
          userName?: string;
          userId: string;
      })
    | (BaseRoomEvent & {
          event: "game_paused";
          userName?: string;
          reason: string;
          timeoutAt: string;
      })
    | (BaseRoomEvent & {
          event: "game_resumed";
          userName?: string;
      })
    | (BaseRoomEvent & {
          event: "leader_promoted";
          newLeaderId: string;
          newLeaderName: string;
      })
    | (BaseRoomEvent & {
          event: "game_aborted";
          reason: string;
      })
    | (BaseRoomEvent & {
          event: "user_kicked";
          userId: string;
          userName?: string;
      })
    | (BaseRoomEvent & {
          event: "room_settings_updated";
          settings: RoomSettings;
      })
    | (BaseRoomEvent & {
          event: "game_settings_updated";
          gameSettings: GameSettings;
      })
    | (BaseRoomEvent & {
          event: "player_moved_to_spectators";
          userId: string;
          userName: string;
      })
    | (BaseRoomEvent & {
          event: "player_slot_claimed";
          claimingUserId: string;
          claimingUserName: string;
          targetSlotUserId: string;
      })
    | (BaseRoomEvent & {
          event: "teams_set";
          teams: string[][];
      });
