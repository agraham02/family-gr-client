import { User } from "..";
import { DominoesData } from "./dominoes";
import { SpadesData, SpadesPlayerData } from "./spades";

export type BaseGameEvent = {
    event: string;
};

export type GameEventPayload =
    | (BaseGameEvent & { event: "sync"; gameState: GameData })
    | { event: "player_sync"; playerState: PlayerData }
    | { event: "player_left"; userName: string }
    | { event: "game_aborted"; reason: string };

export type Players = Record<string, User>;

export type BaseGameData = {
    type: string;
    players: Players;
    leaderId: string;
    // Add other shared fields here if needed
};

export type BasePlayerData = {
    localOrdering: string[];
    // Add other shared fields here if needed
};

export type GameData = DominoesData | SpadesData;
export type PlayerData = SpadesPlayerData;

export * from "./dominoes";
export * from "./spades";
