"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { PlayingCard as PlayingCardType } from "@/types";
import { useGameTable } from "./GameTable";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TrickPlay {
    playerId: string;
    card: PlayingCardType;
    playerName?: string;
}

interface TrickPileProps {
    plays: TrickPlay[];
    winningPlayerId?: string;
    winningCard?: PlayingCardType;
    className?: string;
}

// Card positions in the trick pile - creates a natural spread with random variation
function getCardPosition(
    index: number,
    playerId: string
): { x: number; y: number; rotation: number } {
    // Base positions for up to 8 cards
    const basePositions = [
        { x: 0, y: 0 },
        { x: 45, y: -5 },
        { x: -45, y: 5 },
        { x: 20, y: 35 },
        { x: -20, y: -35 },
        { x: 55, y: 25 },
        { x: -55, y: -25 },
        { x: 0, y: 50 },
    ];

    const base = basePositions[index % basePositions.length];

    // Add slight random variation based on playerId (deterministic per card)
    const hash = playerId
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomRotation = (hash % 25) - 12 + index * 3; // -12 to +12 degrees base + slight increment
    const randomOffsetX = (hash % 10) - 5;
    const randomOffsetY = ((hash * 7) % 10) - 5;

    return {
        x: base.x + randomOffsetX,
        y: base.y + randomOffsetY,
        rotation: randomRotation,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Suit map for rendering
// ─────────────────────────────────────────────────────────────────────────────

const SUIT_MAP = {
    Spades: "♠",
    Hearts: "♥",
    Diamonds: "♦",
    Clubs: "♣",
};

const SUIT_COLORS = {
    Spades: "text-slate-900",
    Hearts: "text-red-500",
    Diamonds: "text-red-500",
    Clubs: "text-slate-900",
};

// ─────────────────────────────────────────────────────────────────────────────
// TrickPile Component
// ─────────────────────────────────────────────────────────────────────────────

function TrickPile({
    plays,
    winningPlayerId,
    winningCard,
    className,
}: TrickPileProps) {
    const { dimensions } = useGameTable();

    return (
        <div
            className={cn(
                "relative flex items-center justify-center",
                "min-h-[120px] min-w-[180px] md:min-h-[160px] md:min-w-[240px]",
                className
            )}
        >
            <AnimatePresence mode="popLayout">
                {plays.map((play, index) => {
                    const isWinning =
                        winningCard &&
                        play.card.rank === winningCard.rank &&
                        play.card.suit === winningCard.suit;

                    const pos = getCardPosition(index, play.playerId);

                    return (
                        <motion.div
                            key={`${play.playerId}-${play.card.rank}-${play.card.suit}`}
                            className="absolute"
                            initial={{
                                scale: 0.5,
                                opacity: 0,
                                x: 0,
                                y: 60,
                                rotate: 0,
                            }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                                x: pos.x,
                                y: pos.y,
                                rotate: pos.rotation,
                            }}
                            exit={{
                                scale: 0.3,
                                opacity: 0,
                                y: -40,
                                transition: {
                                    duration: 0.15,
                                    ease: "easeIn",
                                },
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                                mass: 0.8,
                            }}
                            style={{ zIndex: index }}
                        >
                            {/* Card */}
                            <div
                                className={cn(
                                    "relative w-14 h-20 md:w-16 md:h-24 rounded-lg bg-white shadow-xl",
                                    "border border-gray-200 overflow-hidden",
                                    isWinning &&
                                        "ring-4 ring-amber-400 shadow-amber-400/50"
                                )}
                            >
                                {/* Card content */}
                                <div className="absolute inset-0 flex flex-col p-1">
                                    {/* Top-left */}
                                    <div
                                        className={cn(
                                            "text-[10px] md:text-xs font-bold flex flex-col items-center leading-tight",
                                            SUIT_COLORS[play.card.suit]
                                        )}
                                    >
                                        <span>{play.card.rank}</span>
                                        <span className="-mt-0.5">
                                            {SUIT_MAP[play.card.suit]}
                                        </span>
                                    </div>

                                    {/* Center */}
                                    <div
                                        className={cn(
                                            "flex-1 flex items-center justify-center text-xl md:text-2xl",
                                            SUIT_COLORS[play.card.suit]
                                        )}
                                    >
                                        {SUIT_MAP[play.card.suit]}
                                    </div>

                                    {/* Bottom-right (rotated) */}
                                    <div
                                        className={cn(
                                            "text-[10px] md:text-xs font-bold flex flex-col items-center leading-tight rotate-180",
                                            SUIT_COLORS[play.card.suit]
                                        )}
                                    >
                                        <span>{play.card.rank}</span>
                                        <span className="-mt-0.5">
                                            {SUIT_MAP[play.card.suit]}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Winning indicator */}
                            {isWinning && (
                                <motion.div
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 15,
                                        delay: 0.2,
                                    }}
                                >
                                    <span className="text-amber-900 text-xs font-bold">
                                        ✓
                                    </span>
                                </motion.div>
                            )}

                            {/* Player name label */}
                            {play.playerName && (
                                <motion.div
                                    className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <span className="text-[10px] text-white/70 font-medium bg-black/30 px-2 py-0.5 rounded-full">
                                        {play.playerName}
                                    </span>
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Empty state */}
            {plays.length === 0 && (
                <motion.div
                    className="text-white/30 text-sm font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    Waiting for cards...
                </motion.div>
            )}
        </div>
    );
}

export default TrickPile;
