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
            <div className="row-start-2 col-start-2 flex flex-col items-center justify-center">
                <div className="m-2">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-lg font-semibold text-gray-700">
                            Round {gameData.completedTricks.length + 1}
                        </span>
                        {gameData.phase === "trick-result" && (
                            <div className="w-full max-w-xs bg-white/80 rounded-xl shadow-lg p-4 flex flex-col items-center gap-2 border border-emerald-200 animate-fade-in">
                                <span className="text-lg text-gray-700 text-center">
                                    <span className="font-bold text-emerald-700">
                                        {gameData.players[
                                            gameData.lastTrickWinnerId ?? ""
                                        ]?.name || "Unknown"}
                                    </span>
                                    {" won the trick."}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <CardPile
                    cards={gameData.currentTrick?.plays.map(
                        (play) => play.card
                    )}
                    winningCard={
                        gameData.phase === "trick-result"
                            ? gameData.lastTrickWinningCard
                            : undefined
                    }
                />
            </div>
        </div>
    );
}
