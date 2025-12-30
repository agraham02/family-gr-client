import { BaseGameData } from "..";

export interface PlayingCard {
    rank: string;
    suit: "Spades" | "Hearts" | "Diamonds" | "Clubs";
}

export interface SpadesSettings {
    allowNil: boolean;
    bagsPenalty: number;
    winTarget: number;
    blindNilEnabled: boolean;
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
    phase:
        | "bidding"
        | "playing"
        | "trick-result"
        | "scoring"
        | "round-summary"
        | "finished";
    round: number;
    settings: SpadesSettings;
    history: string[];
    handsCounts: Record<string, number>;
    lastTrickWinnerId?: string;
    lastTrickWinningCard?: PlayingCard;

    roundTrickCounts: Record<string, number>;
    roundTeamScores: Record<number, number>; // scores for each team for the round.
    roundScoreBreakdown: Record<number, unknown>;
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
