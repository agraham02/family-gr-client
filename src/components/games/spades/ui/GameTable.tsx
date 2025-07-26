// components/GameTable.tsx
"use client";

import CardHand from "./CardHand";
import React from "react";
import CardPile from "./CardPile";
import { SpadesData, SpadesPlayerData } from "@/types";

const positions = [
    {
        grid: "row-start-3 col-span-3 flex justify-center",
        isLocal: true,
        isSide: false,
    }, // bottom
    {
        grid: "row-start-2 col-start-1 flex justify-center items-center",
        isLocal: false,
        isSide: true,
    }, // left
    {
        grid: "row-start-1 col-span-3 flex justify-center",
        isLocal: false,
        isSide: false,
    }, // top
    {
        grid: "row-start-2 col-start-3 flex justify-center items-center",
        isLocal: false,
        isSide: true,
    }, // right
];

export default function GameTable({
    gameData,
    playerData,
    handleCardPlay,
}: {
    gameData: SpadesData;
    playerData: SpadesPlayerData;
    handleCardPlay?: (card: { suit: string; rank: string }) => void;
}) {
    if (!gameData || !playerData) {
        return <div>Loading Game...</div>;
    }

    return (
        <div className="relative h-full grow w-full grid grid-rows-[auto_minmax(0,1fr)_auto] grid-cols-[minmax(64px,auto)_1fr_minmax(64px,auto)] select-none bg-emerald-100/30">
            {playerData.localOrdering.map((playerId: string, idx: number) => (
                <div key={playerId} className={positions[idx].grid}>
                    <CardHand
                        playerName={
                            gameData.players[playerId]?.name || "Unknown"
                        }
                        isCurrentPlayer={
                            gameData.playOrder[gameData.currentTurnIndex] ===
                            playerId
                        }
                        cards={positions[idx].isLocal ? playerData.hand : []}
                        cardCount={
                            positions[idx].isLocal
                                ? playerData.hand.length
                                : gameData.handsCounts?.[playerId] ?? 0
                        }
                        isLocalPlayer={positions[idx].isLocal}
                        isSide={positions[idx].isSide}
                        handleCardPlay={
                            positions[idx].isLocal ? handleCardPlay : undefined
                        }
                    />
                </div>
            ))}
            <div className="row-start-2 col-start-2 flex flex-col items-center justify-center border-2 border-dashed border-blue-600">
                <div className="m-2">
                    Round {gameData.completedTricks.length + 1}
                </div>
                <CardPile
                    cards={gameData.currentTrick?.plays.map(
                        (play) => play.card
                    )}
                />
            </div>
        </div>
    );
}
