"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
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
    CardDeck,
    DealingCard,
    PlayerInfo,
    TrickPile,
    EdgePosition,
    useGameTable,
} from "@/components/games/shared";
import { Button } from "@/components/ui/button";
import { getUnplayableCardIndices } from "@/lib/spadesValidation";

// ─────────────────────────────────────────────────────────────────────────────
// DealingCardsOverlay - Uses GameTable context for dimensions
// ─────────────────────────────────────────────────────────────────────────────

interface DealingCardsOverlayProps {
    dealingCards: { id: string; targetPosition: EdgePosition; delay: number }[];
}

function DealingCardsOverlay({ dealingCards }: DealingCardsOverlayProps) {
    const { dimensions } = useGameTable();

    return (
        <AnimatePresence>
            {dealingCards.map((dealCard) => (
                <DealingCard
                    key={dealCard.id}
                    targetPosition={dealCard.targetPosition}
                    delay={dealCard.delay}
                    containerDimensions={{
                        width: dimensions.width,
                        height: dimensions.height,
                    }}
                />
            ))}
        </AnimatePresence>
    );
}

interface SpadesGameTableProps {
    gameData: SpadesData;
    playerData: SpadesPlayerData;
    isMyTurn: boolean;
    onCardPlay: (card: PlayingCardType) => void;
    showHints?: boolean;
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
    showHints = false,
}: SpadesGameTableProps) {
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
        null
    );
    const [isHeroHandSpread, setIsHeroHandSpread] = useState(false);

    // Deal animation state
    const [isDealing, setIsDealing] = useState(false);
    const [dealingCards, setDealingCards] = useState<
        { id: string; targetPosition: EdgePosition; delay: number }[]
    >([]);
    const [visibleCardCounts, setVisibleCardCounts] = useState<
        Record<string, number>
    >({});
    const previousRoundRef = useRef<number | null>(null);
    const hasDealtRef = useRef(false);

    const playerCount = playerData.localOrdering.length;

    // Calculate which cards are unplayable when hints are enabled
    const disabledCardIndices =
        showHints && isMyTurn && gameData.phase === "playing"
            ? getUnplayableCardIndices(
                  playerData.hand,
                  gameData.currentTrick,
                  gameData.spadesBroken
              )
            : [];

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

    // Deal animation effect - trigger when round changes
    useEffect(() => {
        const currentRound = gameData.round;
        const cardsPerPlayer = 13; // Standard spades deal

        // Detect new round (round changed or first load with cards)
        const isNewRound =
            previousRoundRef.current !== null &&
            previousRoundRef.current !== currentRound;
        const isFirstLoad =
            previousRoundRef.current === null &&
            playerData.hand.length === cardsPerPlayer &&
            !hasDealtRef.current;

        if (isNewRound || isFirstLoad) {
            hasDealtRef.current = true;

            // Start deal animation
            const runDealAnimation = async () => {
                setIsDealing(true);
                setVisibleCardCounts({});
                setDealingCards([]);

                // Brief pause before dealing
                await new Promise((resolve) => setTimeout(resolve, 300));

                // Build deal sequence - cycle through players like a real dealer
                const dealSequence: {
                    playerId: string;
                    position: EdgePosition;
                }[] = [];
                for (let round = 0; round < cardsPerPlayer; round++) {
                    for (let p = 0; p < playerCount; p++) {
                        const playerId = playerData.localOrdering[p];
                        dealSequence.push({
                            playerId,
                            position: getEdgePosition(p, playerCount),
                        });
                    }
                }

                // Deal cards with animation
                const CARD_INTERVAL = 25; // Fast dealing
                for (let i = 0; i < dealSequence.length; i++) {
                    const { playerId, position } = dealSequence[i];
                    const dealingCardId = `deal-${currentRound}-${i}`;

                    // Show flying card
                    setDealingCards([
                        {
                            id: dealingCardId,
                            targetPosition: position,
                            delay: 0,
                        },
                    ]);

                    // Wait for animation
                    await new Promise((resolve) =>
                        setTimeout(resolve, CARD_INTERVAL - 8)
                    );

                    // Increment visible count for this player
                    setVisibleCardCounts((prev) => ({
                        ...prev,
                        [playerId]: (prev[playerId] || 0) + 1,
                    }));
                    setDealingCards([]);

                    // Small gap
                    await new Promise((resolve) => setTimeout(resolve, 8));
                }

                setIsDealing(false);
            };

            runDealAnimation();
        }

        previousRoundRef.current = currentRound;
    }, [
        gameData.round,
        playerData.hand.length,
        playerData.localOrdering,
        playerCount,
    ]);

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

    // Calculate cards to show during dealing animation
    const getCardsToShow = (
        playerId: string,
        isLocal: boolean
    ): PlayingCardType[] => {
        if (!isDealing) {
            return isLocal ? playerData.hand : [];
        }
        // During dealing, show cards up to the visible count
        const visibleCount = visibleCardCounts[playerId] || 0;
        if (isLocal) {
            return playerData.hand.slice(0, visibleCount);
        }
        return [];
    };

    const getCardCountToShow = (playerId: string): number => {
        if (!isDealing) {
            return gameData.handsCounts?.[playerId] ?? 0;
        }
        return visibleCardCounts[playerId] || 0;
    };

    return (
        <div className="h-full w-full">
            <LayoutGroup>
                <GameTable
                    playerCount={playerCount}
                    isDealing={isDealing}
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
                        const edgePosition = getEdgePosition(
                            index,
                            playerCount
                        );

                        // Get team color
                        let teamColor: string | undefined;
                        Object.entries(gameData.teams).forEach(
                            ([teamId, team]) => {
                                if (team.players.includes(playerId)) {
                                    teamColor =
                                        teamId === "0" ? "#3b82f6" : "#ef4444";
                                }
                            }
                        );

                        return (
                            <EdgeRegion
                                key={playerId}
                                position={edgePosition}
                                isHero={isLocal}
                                isDealing={isDealing}
                            >
                                <PlayerInfo
                                    playerId={playerId}
                                    playerName={player?.name || "Unknown"}
                                    isCurrentTurn={isCurrentTurn && !isDealing}
                                    isLocalPlayer={isLocal}
                                    seatPosition={edgePosition}
                                    bid={bid}
                                    tricksWon={tricksWon}
                                    teamColor={teamColor}
                                />
                                <CardHand
                                    cards={getCardsToShow(playerId, isLocal)}
                                    cardCount={getCardCountToShow(playerId)}
                                    isLocalPlayer={isLocal}
                                    interactive={
                                        isLocal &&
                                        isMyTurn &&
                                        gameData.phase === "playing" &&
                                        !isDealing
                                    }
                                    selectedIndex={
                                        isLocal ? selectedCardIndex : null
                                    }
                                    disabledIndices={
                                        isLocal ? disabledCardIndices : []
                                    }
                                    onCardClick={
                                        isLocal ? handleCardSelect : undefined
                                    }
                                    playerId={playerId}
                                    isDealing={isDealing}
                                    isSpreadControlled={
                                        isLocal ? isHeroHandSpread : undefined
                                    }
                                    onSpreadChange={
                                        isLocal
                                            ? setIsHeroHandSpread
                                            : undefined
                                    }
                                />
                            </EdgeRegion>
                        );
                    })}

                    {/* Center Area */}
                    <TableCenter className="flex flex-col items-center gap-4">
                        {/* Deal animation - deck and flying cards */}
                        {isDealing && (
                            <>
                                <CardDeck
                                    cardCount={52 - dealingCards.length * 4}
                                />
                                <DealingCardsOverlay
                                    dealingCards={dealingCards}
                                />
                            </>
                        )}

                        {/* Round indicator - hide during dealing */}
                        {!isDealing && (
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
                        )}

                        {/* Trick pile - hide during dealing */}
                        {!isDealing && (
                            <TrickPile
                                plays={trickPlays}
                                winningPlayerId={gameData.lastTrickWinnerId}
                                winningCard={
                                    gameData.phase === "trick-result"
                                        ? gameData.lastTrickWinningCard
                                        : undefined
                                }
                            />
                        )}

                        {/* Trick result message */}
                        <AnimatePresence>
                            {!isDealing &&
                                gameData.phase === "trick-result" &&
                                gameData.lastTrickWinnerId && (
                                    <motion.div
                                        className="bg-amber-500/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg"
                                        initial={{
                                            opacity: 0,
                                            scale: 0.8,
                                            y: 20,
                                        }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.8,
                                            y: -20,
                                        }}
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
            </LayoutGroup>

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
