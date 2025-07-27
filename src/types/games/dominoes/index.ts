import { BaseGameData } from "..";

export type DominoesData = BaseGameData & {
    dominoCount: number;
    board: string[];
    // Add more dominoes fields
};
