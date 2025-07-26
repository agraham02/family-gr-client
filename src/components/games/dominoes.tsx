import { DominoesData, PlayerData } from "@/types";
import React from "react";

export default function Dominoes({
    gameData,
    playerData,
}: {
    gameData: DominoesData;
    playerData: PlayerData;
}) {
    return <div>Dominoes - Count: {gameData.dominoCount}</div>;
}
