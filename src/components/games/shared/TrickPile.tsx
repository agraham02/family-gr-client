"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import PlayingCard from "./PlayingCard";
import { PlayingCard as PlayingCardType } from "@/types";

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

// Position offsets for cards in the trick pile (creates a spread effect)
const CARD_POSITIONS = [
    { x: 0, y: 0, rotation: -5 },
    { x: 45, y: -5, rotation: 3 },
    { x: -45, y: 5, rotation: -3 },
    { x: 10, y: 35, rotation: 7 },
    { x: -10, y: -35, rotation: -8 },
    { x: 55, y: 25, rotation: 12 },
    { x: -55, y: -25, rotation: -10 },
    { x: 0, y: 50, rotation: 2 },
];

function TrickPile({
    plays,
    winningPlayerId,
    winningCard,
    className,
}: TrickPileProps) {
    return (
        <div
            className={cn(
                "relative flex items-center justify-center min-h-[140px] min-w-[200px]",
                className
            )}
        >
            <AnimatePresence mode="popLayout">
                {plays.map((play, index) => {
                    const isWinning =
                        winningCard &&
                        play.card.rank === winningCard.rank &&
                        play.card.suit === winningCard.suit;

                    const pos = CARD_POSITIONS[index % CARD_POSITIONS.length];

                    return (
                        <motion.div
                            key={`${play.playerId}-${play.card.rank}-${play.card.suit}`}
                            className="absolute"
                            initial={{
                                scale: 0.5,
                                opacity: 0,
                                x: 0,
                                y: 100,
                            }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                                x: pos.x,
                                y: pos.y,
                                rotate: pos.rotation,
                            }}
                            exit={{
                                scale: 0.5,
                                opacity: 0,
                                y: -50,
                                transition: { duration: 0.3 },
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                            }}
                            style={{ zIndex: index }}
                        >
                            <div className="relative">
                                <PlayingCard
                                    card={play.card}
                                    size="md"
                                    highlighted={isWinning}
                                    className={cn(
                                        isWinning &&
                                            "ring-4 ring-amber-400 shadow-lg shadow-amber-400/50"
                                    )}
                                />

                                {/* Winning indicator */}
                                {isWinning && (
                                    <motion.div
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center"
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
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Empty state */}
            {plays.length === 0 && (
                <div className="text-white/30 text-sm font-medium">
                    Waiting for cards...
                </div>
            )}
        </div>
    );
}

export default TrickPile;
