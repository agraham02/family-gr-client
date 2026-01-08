"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
    SpadesData,
    SpadesPlayerData,
    PlayingCard as PlayingCardType,
} from "@/types";
import {
    GameTable,
    TableCenter,
    EdgeRegion,
    CardHand,
    PlayerInfo,
    TrickPile,
    EdgePosition,
} from "@/components/games/shared";
import { Button } from "@/components/ui/button";

interface SpadesGameTableProps {
    gameData: SpadesData;
    playerData: SpadesPlayerData;
    isMyTurn: boolean;
    onCardPlay: (card: PlayingCardType) => void;
}

// Helper function to map player index to edge position
function getEdgePosition(index: number, playerCount: number): EdgePosition {
    if (playerCount === 2) {
        return index === 0 ? "bottom" : "top";
    }
    if (playerCount === 3) {
        if (index === 0) return "bottom";
        if (index === 1) return "left";
        return "right";
    }
    // 4 players (standard for Spades)
    if (index === 0) return "bottom";
    if (index === 1) return "left";
    if (index === 2) return "top";
    if (index === 3) return "right";
    return "top";
}

function SpadesGameTable({
    gameData,
    playerData,
    isMyTurn,
    onCardPlay,
}: SpadesGameTableProps) {
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
        null
    );
    const [isHeroHandSpread, setIsHeroHandSpread] = useState(false);

    const playerCount = playerData.localOrdering.length;

    // Handle card selection (two-step: select, then confirm)
    const handleCardSelect = useCallback(
        (index: number, card: PlayingCardType) => {
            if (selectedCardIndex === index) {
                // Clear selection and spread FIRST to prevent visual glitch
                setSelectedCardIndex(null);
                setIsHeroHandSpread(false);
                // Then play the card
                onCardPlay(card);
            } else {
                // Select the card
                setSelectedCardIndex(index);
            }
        },
        [selectedCardIndex, onCardPlay]
    );

    // Handle play button click
    const handlePlayCard = useCallback(() => {
        if (selectedCardIndex !== null && playerData.hand[selectedCardIndex]) {
            const card = playerData.hand[selectedCardIndex];
            // Clear selection and spread FIRST
            setSelectedCardIndex(null);
            setIsHeroHandSpread(false);
            // Then play the card
            onCardPlay(card);
        }
    }, [selectedCardIndex, playerData.hand, onCardPlay]);

    // Handle cancel selection
    const handleCancelSelection = useCallback(() => {
        setSelectedCardIndex(null);
    }, []);

    // Track if we've shown the turn toast for this turn
    const turnToastShownRef = useRef<number | null>(null);

    // Reset selection and spread when turn changes or phase changes
    useEffect(() => {
        setSelectedCardIndex(null);
        setIsHeroHandSpread(false);
    }, [gameData.currentTurnIndex, gameData.phase]);

    // Show toast when it's the player's turn
    useEffect(() => {
        if (
            isMyTurn &&
            gameData.phase === "playing" &&
            turnToastShownRef.current !== gameData.currentTurnIndex
        ) {
            turnToastShownRef.current = gameData.currentTurnIndex;
            toast.info("Your turn! Select a card to play", {
                id: "your-turn-toast",
                duration: 4000,
                dismissible: true,
            });
        }
    }, [isMyTurn, gameData.phase, gameData.currentTurnIndex]);

    // Handle table click to collapse spread hands
    const handleTableClick = useCallback(() => {
        if (isHeroHandSpread) {
            setIsHeroHandSpread(false);
        }
    }, [isHeroHandSpread]);

    // Get trick plays for display
    const trickPlays =
        gameData.currentTrick?.plays.map((play) => ({
            playerId: play.playerId,
            card: play.card,
            playerName: gameData.players[play.playerId]?.name,
        })) ?? [];

    return (
        <div className="h-full w-full">
            <GameTable
                playerCount={playerCount}
                isDealing={false}
                showDebugGrid={false}
                onTableClick={handleTableClick}
            >
                {/* Player Edge Regions */}
                {playerData.localOrdering.map((playerId, index) => {
                    const isLocal = index === 0;
                    const player = gameData.players[playerId];
                    const isCurrentTurn =
                        gameData.playOrder[gameData.currentTurnIndex] ===
                        playerId;
                    const bid = gameData.bids[playerId]?.amount ?? null;
                    const tricksWon =
                        gameData.roundTrickCounts?.[playerId] ?? 0;
                    const cardCount = gameData.handsCounts?.[playerId] ?? 0;
                    const edgePosition = getEdgePosition(index, playerCount);

                    // Get team color
                    let teamColor: string | undefined;
                    Object.entries(gameData.teams).forEach(([teamId, team]) => {
                        if (team.players.includes(playerId)) {
                            teamColor = teamId === "0" ? "#3b82f6" : "#ef4444";
                        }
                    });

                    return (
                        <EdgeRegion
                            key={playerId}
                            position={edgePosition}
                            isHero={isLocal}
                            isDealing={false}
                        >
                            <PlayerInfo
                                playerId={playerId}
                                playerName={player?.name || "Unknown"}
                                isCurrentTurn={isCurrentTurn}
                                isLocalPlayer={isLocal}
                                seatPosition={edgePosition}
                                bid={bid}
                                tricksWon={tricksWon}
                                teamColor={teamColor}
                            />
                            <CardHand
                                cards={isLocal ? playerData.hand : []}
                                cardCount={cardCount}
                                isLocalPlayer={isLocal}
                                interactive={
                                    isLocal &&
                                    isMyTurn &&
                                    gameData.phase === "playing"
                                }
                                selectedIndex={
                                    isLocal ? selectedCardIndex : null
                                }
                                onCardClick={
                                    isLocal ? handleCardSelect : undefined
                                }
                                playerId={playerId}
                                isDealing={false}
                                isSpreadControlled={
                                    isLocal ? isHeroHandSpread : undefined
                                }
                                onSpreadChange={
                                    isLocal ? setIsHeroHandSpread : undefined
                                }
                            />
                        </EdgeRegion>
                    );
                })}

                {/* Center Area */}
                <TableCenter className="flex flex-col items-center gap-4">
                    {/* Round indicator */}
                    <motion.div
                        className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="text-white/80 text-sm font-medium">
                            Round {gameData.round} • Trick{" "}
                            {gameData.completedTricks.length + 1}
                        </span>
                    </motion.div>

                    {/* Trick pile */}
                    <TrickPile
                        plays={trickPlays}
                        winningPlayerId={gameData.lastTrickWinnerId}
                        winningCard={
                            gameData.phase === "trick-result"
                                ? gameData.lastTrickWinningCard
                                : undefined
                        }
                    />

                    {/* Trick result message */}
                    <AnimatePresence>
                        {gameData.phase === "trick-result" &&
                            gameData.lastTrickWinnerId && (
                                <motion.div
                                    className="bg-amber-500/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg"
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25,
                                    }}
                                >
                                    <span className="text-amber-900 font-semibold">
                                        {gameData.players[
                                            gameData.lastTrickWinnerId
                                        ]?.name || "Unknown"}{" "}
                                        won the trick!
                                    </span>
                                </motion.div>
                            )}
                    </AnimatePresence>
                </TableCenter>
            </GameTable>

            {/* Play card button */}
            <AnimatePresence>
                {selectedCardIndex !== null &&
                    isMyTurn &&
                    gameData.phase === "playing" && (
                        <motion.div
                            className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-2 md:gap-3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <Button
                                onClick={handlePlayCard}
                                className="bg-emerald-600 hover:bg-emerald-700 shadow-lg text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 h-auto"
                            >
                                Play Card
                            </Button>
                            <Button
                                onClick={handleCancelSelection}
                                variant="outline"
                                className="shadow-lg text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 h-auto"
                            >
                                Cancel
                            </Button>
                        </motion.div>
                    )}
            </AnimatePresence>
        </div>
    );
}

export default SpadesGameTable;
