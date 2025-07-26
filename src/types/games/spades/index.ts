import { BaseGameData } from "..";

export interface PlayingCard {
    rank: string;
    suit: "Spades" | "Hearts" | "Diamonds" | "Clubs";
}

export type SpadesData = BaseGameData & {
    hands: string[][];
    id: string;
    roomId: string;
    type: "spades";
    teams: {
        [teamId: string]: {
            players: string[];
            score: number;
        };
    };
    playOrder: string[];
    dealerIndex: number;
    currentTurnIndex: number;
    bids: Record<string, { amount: number }>;
    spadesBroken: boolean;
    currentTrick: SpadesTrick | null;
    completedTricks: SpadesTrick[];
    phase: "bidding" | "playing" | "scoring" | "ended";
    round: number;
    settings: object;
    history: [];
    handsCounts: Record<string, number>;
    // Add more spades fields
};

export type SpadesPlayerData = {
    localOrdering: string[];
    hand: PlayingCard[];
    // Add other player-specific data as needed
};

export type SpadesTrick = {
    plays: {
        playerId: string;
        card: PlayingCard;
    }[];
};
