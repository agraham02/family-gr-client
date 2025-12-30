"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    SpadesData,
    SpadesPlayerData,
    PlayingCard as PlayingCardType,
} from "@/types";
import {
    CardTableLayout,
    TableSeat,
    TableCenter,
    useCardTable,
    CardFan,
    PlayerSeat,
    TrickPile,
    PlayCardButton,
} from "@/components/games/shared";

interface SpadesGameTableProps {
    gameData: SpadesData;
    playerData: SpadesPlayerData;
    isMyTurn: boolean;
    onCardPlay: (card: PlayingCardType) => void;
}

// Ordering configuration for player info relative to cards
// Cards should be at edge, player info toward center
function getLayoutOrder(position: string): { cardsFirst: boolean } {
    switch (position) {
        case "bottom":
            // Cards at bottom edge, info above
            return { cardsFirst: false };
        case "top":
            // Cards at top edge, info below
            return { cardsFirst: true };
        case "left":
        case "bottom-left":
        case "top-left":
            // Cards at left edge, info to the right
            return { cardsFirst: true };
        case "right":
        case "bottom-right":
        case "top-right":
            // Cards at right edge, info to the left
            return { cardsFirst: false };
        default:
            return { cardsFirst: false };
    }
}

// Individual player seat component
function SpadesPlayerSeat({
    playerId,
    gameData,
    playerData,
    localIndex,
    isMyTurn,
    selectedCardIndex,
    onCardSelect,
}: {
    playerId: string;
    gameData: SpadesData;
    playerData: SpadesPlayerData;
    localIndex: number;
    isMyTurn: boolean;
    selectedCardIndex: number | null;
    onCardSelect: (index: number, card: PlayingCardType) => void;
}) {
    const { getSeatConfig } = useCardTable();
    const config = getSeatConfig(localIndex);

    const isLocal = localIndex === 0;
    const player = gameData.players[playerId];
    const isCurrentTurn =
        gameData.playOrder[gameData.currentTurnIndex] === playerId;
    const bid = gameData.bids[playerId]?.amount ?? null;
    const tricksWon = gameData.roundTrickCounts?.[playerId] ?? 0;
    const cardCount = gameData.handsCounts?.[playerId] ?? 0;

    // Get team color
    let teamColor: string | undefined;
    Object.entries(gameData.teams).forEach(([teamId, team]) => {
        if (team.players.includes(playerId)) {
            teamColor = teamId === "0" ? "#3b82f6" : "#ef4444";
        }
    });

    // Determine card size based on position - responsive for mobile/desktop
    // Local player: md on mobile, lg on desktop
    // Opponents: xs on mobile, sm on desktop
    const getResponsiveCardSize = () => {
        if (typeof window !== "undefined") {
            const isMobile = window.innerWidth < 768;
            if (isLocal) {
                return isMobile ? "md" : "lg";
            }
            return isMobile ? "xs" : "sm";
        }
        return isLocal ? "lg" : "sm";
    };
    const cardSize = getResponsiveCardSize();

    // Get layout ordering - cards at edge, info toward center
    const layout = getLayoutOrder(config.position);

    const playerInfo = (
        <PlayerSeat
            playerId={playerId}
            playerName={player?.name || "Unknown"}
            isCurrentTurn={isCurrentTurn}
            isLocalPlayer={isLocal}
            position={config.position}
            bid={bid}
            tricksWon={tricksWon}
            teamColor={teamColor}
        />
    );

    const cardFan = (
        <CardFan
            cards={isLocal ? playerData.hand : []}
            cardCount={cardCount}
            position={config.fanPosition}
            size={cardSize}
            interactive={isLocal && isMyTurn && gameData.phase === "playing"}
            selectedIndex={isLocal ? selectedCardIndex : null}
            onCardClick={isLocal ? onCardSelect : undefined}
            playerId={playerId}
        />
    );

    return (
        <TableSeat index={localIndex} className="gap-1 md:gap-2">
            {layout.cardsFirst ? (
                <>
                    {cardFan}
                    {playerInfo}
                </>
            ) : (
                <>
                    {playerInfo}
                    {cardFan}
                </>
            )}
        </TableSeat>
    );
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

    // Handle card selection (two-step: select, then confirm)
    const handleCardSelect = useCallback(
        (index: number, card: PlayingCardType) => {
            if (selectedCardIndex === index) {
                // Clicking the same card plays it
                onCardPlay(card);
                setSelectedCardIndex(null);
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
            onCardPlay(playerData.hand[selectedCardIndex]);
            setSelectedCardIndex(null);
        }
    }, [selectedCardIndex, playerData.hand, onCardPlay]);

    // Handle cancel selection
    const handleCancelSelection = useCallback(() => {
        setSelectedCardIndex(null);
    }, []);

    // Reset selection when turn changes or phase changes
    React.useEffect(() => {
        setSelectedCardIndex(null);
    }, [gameData.currentTurnIndex, gameData.phase]);

    // Get trick plays for display
    const trickPlays =
        gameData.currentTrick?.plays.map((play) => ({
            playerId: play.playerId,
            card: play.card,
            playerName: gameData.players[play.playerId]?.name,
        })) ?? [];

    return (
        <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800">
            {/* Table felt texture overlay */}
            <div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.3) 100%)`,
                }}
            />

            {/* Main game table layout */}
            <CardTableLayout
                playerCount={playerData.localOrdering.length}
                className="relative z-10"
            >
                {/* Player seats */}
                {playerData.localOrdering.map((playerId, index) => (
                    <SpadesPlayerSeat
                        key={playerId}
                        playerId={playerId}
                        gameData={gameData}
                        playerData={playerData}
                        localIndex={index}
                        isMyTurn={isMyTurn}
                        selectedCardIndex={
                            index === 0 ? selectedCardIndex : null
                        }
                        onCardSelect={handleCardSelect}
                    />
                ))}

                {/* Center area - trick pile and round info */}
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
            </CardTableLayout>

            {/* Play card button */}
            <PlayCardButton
                visible={
                    selectedCardIndex !== null &&
                    isMyTurn &&
                    gameData.phase === "playing"
                }
                onPlay={handlePlayCard}
                onCancel={handleCancelSelection}
            />

            {/* Turn indicator message */}
            <AnimatePresence>
                {isMyTurn &&
                    gameData.phase === "playing" &&
                    selectedCardIndex === null && (
                        <motion.div
                            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <div className="bg-blue-500/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg">
                                <span className="text-white font-medium">
                                    Your turn! Select a card to play
                                </span>
                            </div>
                        </motion.div>
                    )}
            </AnimatePresence>
        </div>
    );
}

export default SpadesGameTable;
