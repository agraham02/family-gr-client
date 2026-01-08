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
import {
    generateSpadesMockData,
    generateDominoesMockData,
    SpadesMockOptions,
    DominoesMockOptions,
} from "./mockData";

/**
 * Base props interface that all game components must implement
 */
export interface GameComponentProps<
    TGameData extends GameData = GameData,
    TPlayerData extends PlayerData = PlayerData
> {
    gameData: TGameData;
    playerData: TPlayerData;
    /** Optional flag for debug mode - skips context dependencies */
    debugMode?: boolean;
}

/**
 * Mock data generator function type
 */
type MockDataGenerator<TOptions = Record<string, unknown>> = (
    options?: TOptions
) => {
    gameData: GameData;
    playerData: PlayerData;
};

/**
 * Registry entry for a game component
 */
interface GameRegistryEntry {
    component: ComponentType<GameComponentProps<any, any>>;
    displayName: string;
    /** Generate mock data for debugging */
    generateMockData?: MockDataGenerator<any>;
    /** Default options for mock data generation */
    defaultMockOptions?: Record<string, unknown>;
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
        generateMockData:
            generateDominoesMockData as MockDataGenerator<DominoesMockOptions>,
        defaultMockOptions: {
            playerCount: 4,
            phase: "playing",
            round: 1,
            boardTileCount: 5,
        },
    },
    spades: {
        component: Spades as ComponentType<
            GameComponentProps<SpadesData, SpadesPlayerData>
        >,
        displayName: "Spades",
        generateMockData:
            generateSpadesMockData as MockDataGenerator<SpadesMockOptions>,
        defaultMockOptions: {
            playerCount: 4,
            phase: "playing",
            round: 1,
            includeCurrentTrick: true,
        },
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

/**
 * Get mock data generator for a game type.
 */
export function getMockDataGenerator(
    gameType: string
): MockDataGenerator | null {
    return GAME_REGISTRY[gameType]?.generateMockData ?? null;
}

/**
 * Get display name for a game type.
 */
export function getGameDisplayName(gameType: string): string {
    return GAME_REGISTRY[gameType]?.displayName ?? gameType;
}

/**
 * Get default mock options for a game type.
 */
export function getDefaultMockOptions(
    gameType: string
): Record<string, unknown> {
    return GAME_REGISTRY[gameType]?.defaultMockOptions ?? {};
}
