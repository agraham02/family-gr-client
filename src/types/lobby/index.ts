import { User } from "..";

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
    // Add other fields as needed
};

export type BaseRoomEvent = {
    event: string;
    roomState: LobbyData;
    timestamp: string;
};

export type RoomEventPayload =
    | (BaseRoomEvent & { event: "sync" })
    | (BaseRoomEvent & { event: "user_joined"; userName: string })
    | (BaseRoomEvent & { event: "user_left"; userName: string })
    | (BaseRoomEvent & {
          event: "game_started";
          gameId: string;
          gameState: object;
      });
