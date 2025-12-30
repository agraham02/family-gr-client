// src/components/games/registry.ts
// Game component registry for dynamic game type rendering

import { ComponentType } from "react";
import Dominoes from "./dominoes";
import Spades from "./spades";
import {
    DominoesData,
    DominoesPlayerData,
    SpadesData,
    SpadesPlayerData,
    GameData,
    PlayerData,
} from "@/types";

/**
 * Base props interface that all game components must implement
 */
export interface GameComponentProps<
    TGameData extends GameData = GameData,
    TPlayerData extends PlayerData = PlayerData
> {
    gameData: TGameData;
    playerData: TPlayerData;
}

/**
 * Registry entry for a game component
 */
interface GameRegistryEntry {
    component: ComponentType<GameComponentProps<any, any>>;
    displayName: string;
}

/**
 * Registry mapping game types to their components.
 * Add new games here as they are implemented.
 */
export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
    dominoes: {
        component: Dominoes as ComponentType<
            GameComponentProps<DominoesData, DominoesPlayerData>
        >,
        displayName: "Dominoes",
    },
    spades: {
        component: Spades as ComponentType<
            GameComponentProps<SpadesData, SpadesPlayerData>
        >,
        displayName: "Spades",
    },
};

/**
 * Get the game component for a given game type.
 * Returns null if the game type is not registered.
 */
export function getGameComponent(
    gameType: string
): ComponentType<GameComponentProps<any, any>> | null {
    return GAME_REGISTRY[gameType]?.component ?? null;
}

/**
 * Check if a game type is registered.
 */
export function isGameTypeSupported(gameType: string): boolean {
    return gameType in GAME_REGISTRY;
}

/**
 * Get all registered game types.
 */
export function getRegisteredGameTypes(): string[] {
    return Object.keys(GAME_REGISTRY);
}
