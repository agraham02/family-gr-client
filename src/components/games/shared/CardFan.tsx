"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import PlayingCard, { CardSize } from "./PlayingCard";
import { PlayingCard as PlayingCardType } from "@/types";

export type FanPosition = "bottom" | "top" | "left" | "right";

interface CardFanProps {
    cards: PlayingCardType[];
    cardCount?: number; // For opponent hands where we show backs
    position: FanPosition;
    size?: CardSize;
    interactive?: boolean;
    selectedIndex?: number | null;
    disabledIndices?: number[];
    onCardClick?: (index: number, card: PlayingCardType) => void;
    className?: string;
    playerId?: string; // For layoutId animations
}

// Configuration for fan based on position
const FAN_CONFIG: Record<
    FanPosition,
    {
        containerRotation: number; // rotation of the entire fan container
    }
> = {
    bottom: {
        containerRotation: 0,
    },
    top: {
        containerRotation: 180,
    },
    left: {
        containerRotation: 90,
    },
    right: {
        containerRotation: -90,
    },
};

// Calculate overlap based on card count and position
function getCardSpacing(
    position: FanPosition,
    cardCount: number,
    size: CardSize
): number {
    const baseSizes: Record<CardSize, number> = {
        xs: 20,
        sm: 25,
        md: 35,
        lg: 45,
        xl: 55,
    };

    const base = baseSizes[size];
    // Reduce spacing as cards increase
    const overlapFactor = Math.max(0.3, 1 - (cardCount - 4) * 0.06);

    return base * overlapFactor;
}

function CardFan({
    cards,
    cardCount,
    position,
    size = "md",
    interactive = false,
    selectedIndex = null,
    disabledIndices = [],
    onCardClick,
    className,
    playerId,
}: CardFanProps) {
    const config = FAN_CONFIG[position];
    const isLocalPlayer = position === "bottom";

    // For opponents, we may show backs based on cardCount
    const displayCards =
        isLocalPlayer || cards.length > 0
            ? cards
            : Array(cardCount || 0).fill(null);

    const total = displayCards.length;
    const spacing = getCardSpacing(position, total, size);

    return (
        <div
            className={cn(
                "flex flex-row items-center justify-center",
                className
            )}
            style={{
                transform: `rotate(${config.containerRotation}deg)`,
            }}
        >
            <AnimatePresence mode="popLayout">
                {displayCards.map((card, index) => {
                    const isSelected = selectedIndex === index;
                    const isDisabled = disabledIndices.includes(index);

                    // Cards on right overlap cards on left (higher index = higher z-index)
                    // Selected card always on top
                    const zIndex = isSelected ? 100 : index;

                    // Selection lift for local player only
                    const selectionOffset =
                        isLocalPlayer && isSelected ? -30 : 0;

                    return (
                        <motion.div
                            key={
                                card
                                    ? `${card.suit}-${card.rank}`
                                    : `back-${index}`
                            }
                            layoutId={
                                playerId
                                    ? `${playerId}-card-${index}`
                                    : undefined
                            }
                            className="relative"
                            style={{
                                marginLeft: index === 0 ? 0 : -spacing,
                                zIndex,
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: selectionOffset,
                            }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                            }}
                        >
                            <PlayingCard
                                card={card}
                                hidden={!isLocalPlayer}
                                size={size}
                                rotation={0}
                                selected={isSelected}
                                disabled={isDisabled}
                                interactive={interactive && isLocalPlayer}
                                onClick={() => {
                                    if (card && onCardClick) {
                                        onCardClick(index, card);
                                    }
                                }}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

export default CardFan;
