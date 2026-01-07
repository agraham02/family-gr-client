"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { PlayingCard as PlayingCardType } from "@/types";
import { useGameTable } from "./GameTable";
import { useEdgeRegion } from "./EdgeRegion";
import { CardSize } from "./PlayingCard";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type FanOrientation = "horizontal" | "vertical";

interface CardHandProps {
    /** Cards to display (for local player) */
    cards: PlayingCardType[];
    /** Number of cards (for opponents showing backs) */
    cardCount?: number;
    /** Whether this is the local player's hand */
    isLocalPlayer?: boolean;
    /** Orientation of the fan */
    orientation?: FanOrientation;
    /** Card size */
    size?: CardSize;
    /** Is this hand interactive? */
    interactive?: boolean;
    /** Currently selected card index */
    selectedIndex?: number | null;
    /** Indices of disabled cards */
    disabledIndices?: number[];
    /** Callback when a card is clicked */
    onCardClick?: (index: number, card: PlayingCardType) => void;
    /** Player ID for layoutId animations */
    playerId?: string;
    /** Additional class names */
    className?: string;
    /** Whether cards are being dealt */
    isDealing?: boolean;
    /** Rotation in degrees (overrides EdgeRegion context) */
    rotation?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card dimension constants
// ─────────────────────────────────────────────────────────────────────────────

const SIZE_DIMENSIONS: Record<CardSize, { width: number; height: number }> = {
    xs: { width: 40, height: 56 },
    sm: { width: 52, height: 73 },
    md: { width: 70, height: 98 },
    lg: { width: 90, height: 126 },
    xl: { width: 110, height: 154 },
};

// Calculate card spacing based on count, size, and available width
function getCardSpacing(
    cardCount: number,
    size: CardSize,
    isHorizontal: boolean,
    availableWidth?: number
): number {
    const cardWidth = isHorizontal
        ? SIZE_DIMENSIONS[size].width
        : SIZE_DIMENSIONS[size].height;

    // Base overlap: show about 30-40% of each card
    const baseOverlap = cardWidth * 0.35;

    // Reduce overlap as card count increases
    const overlapMultiplier = Math.max(0.5, 1 - (cardCount - 5) * 0.05);
    const baseSpacing = Math.max(15, baseOverlap * overlapMultiplier);

    // If available width is provided, calculate the minimum spacing needed to fit
    if (availableWidth && cardCount > 1) {
        // Total hand width = cardWidth + (cardCount - 1) * (cardWidth - spacing)
        // Solving for spacing when totalHandWidth = availableWidth:
        // spacing = cardWidth - (availableWidth - cardWidth) / (cardCount - 1)
        const minSpacingToFit =
            cardWidth - (availableWidth - cardWidth) / (cardCount - 1);

        // Use the larger of base spacing or the minimum needed to fit
        // But cap the overlap at 60% of card width (cards should still be recognizable)
        const maxAllowedSpacing = cardWidth * 0.6;
        return Math.min(
            maxAllowedSpacing,
            Math.max(baseSpacing, minSpacingToFit)
        );
    }

    return baseSpacing;
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface CardInHandProps {
    card: PlayingCardType | null;
    index: number;
    totalCards: number;
    isHidden: boolean;
    isSelected: boolean;
    isDisabled: boolean;
    isInteractive: boolean;
    isHorizontal: boolean;
    size: CardSize;
    spacing: number;
    playerId?: string;
    onClick?: () => void;
}

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

function CardInHand({
    card,
    index,
    totalCards,
    isHidden,
    isSelected,
    isDisabled,
    isInteractive,
    isHorizontal,
    size,
    spacing,
    playerId,
    onClick,
}: CardInHandProps) {
    const dimensions = SIZE_DIMENSIONS[size];
    const showBack = card === null || isHidden;

    // Calculate z-index: selected card on top, otherwise by position
    const zIndex = isSelected ? 100 : index;

    // Selection lift - different direction for vertical vs horizontal
    const yOffset = isHorizontal ? (isSelected ? -20 : 0) : 0;
    const xOffset = isHorizontal ? 0 : isSelected ? -20 : 0;

    return (
        <motion.div
            layoutId={
                playerId
                    ? `${playerId}-card-${
                          card ? `${card.suit}-${card.rank}` : index
                      }`
                    : undefined
            }
            className="relative cursor-default"
            style={{
                // Use marginLeft for horizontal, marginTop for vertical
                marginLeft: isHorizontal ? (index === 0 ? 0 : -spacing) : 0,
                marginTop: isHorizontal ? 0 : index === 0 ? 0 : -spacing,
                zIndex,
            }}
            initial={{
                opacity: 0,
                scale: 0.5,
                y: isHorizontal ? 50 : 0,
                x: isHorizontal ? 0 : 50,
            }}
            animate={{
                opacity: 1,
                scale: 1,
                y: yOffset,
                x: xOffset,
            }}
            exit={{
                opacity: 0,
                scale: 0.5,
                y: isHorizontal ? -50 : 0,
                x: isHorizontal ? 0 : -50,
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: index * 0.03,
            }}
            whileHover={
                isInteractive && !isDisabled
                    ? {
                          y: isHorizontal ? yOffset - 12 : yOffset,
                          x: isHorizontal ? xOffset : xOffset - 12,
                          scale: 1.05,
                          transition: { duration: 0.15 },
                      }
                    : undefined
            }
            whileTap={
                isInteractive && !isDisabled ? { scale: 0.98 } : undefined
            }
            onClick={isInteractive && !isDisabled ? onClick : undefined}
        >
            <div
                className={cn(
                    "relative rounded-lg shadow-lg bg-white border border-gray-200 overflow-hidden select-none",
                    isInteractive && !isDisabled && "cursor-pointer",
                    isSelected &&
                        "ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent",
                    isDisabled && "opacity-50 cursor-not-allowed"
                )}
                style={{
                    width: dimensions.width,
                    height: dimensions.height,
                }}
            >
                {/* Card Face */}
                {!showBack && card && (
                    <div className="absolute inset-0 flex flex-col p-1">
                        {/* Top-left corner */}
                        <div
                            className={cn(
                                "text-xs font-bold leading-tight flex flex-col items-center",
                                SUIT_COLORS[card.suit]
                            )}
                        >
                            <span>{card.rank}</span>
                            <span className="-mt-0.5">
                                {SUIT_MAP[card.suit]}
                            </span>
                        </div>

                        {/* Center suit */}
                        <div
                            className={cn(
                                "flex-1 flex items-center justify-center text-2xl",
                                SUIT_COLORS[card.suit]
                            )}
                        >
                            {SUIT_MAP[card.suit]}
                        </div>

                        {/* Bottom-right corner (rotated) */}
                        <div
                            className={cn(
                                "text-xs font-bold leading-tight flex flex-col items-center rotate-180",
                                SUIT_COLORS[card.suit]
                            )}
                        >
                            <span>{card.rank}</span>
                            <span className="-mt-0.5">
                                {SUIT_MAP[card.suit]}
                            </span>
                        </div>
                    </div>
                )}

                {/* Card Back */}
                {showBack && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center">
                        <div
                            className="w-3/4 h-3/4 rounded border-2 border-blue-400/50"
                            style={{
                                backgroundImage: `
                                    repeating-linear-gradient(
                                        45deg,
                                        transparent,
                                        transparent 3px,
                                        rgba(255,255,255,0.1) 3px,
                                        rgba(255,255,255,0.1) 6px
                                    )
                                `,
                            }}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CardHand Component
// ─────────────────────────────────────────────────────────────────────────────

function CardHand({
    cards,
    cardCount,
    isLocalPlayer = false,
    orientation,
    size,
    interactive = false,
    selectedIndex = null,
    disabledIndices = [],
    onCardClick,
    playerId,
    className,
    isDealing = false,
    rotation: rotationProp,
}: CardHandProps) {
    const { dimensions } = useGameTable();
    const edgeContext = useEdgeRegion();

    // Get rotation from prop, EdgeRegion context, or default to 0
    const rotation = rotationProp ?? edgeContext?.cardRotation ?? 0;

    // Determine orientation - always horizontal (cards laid out side by side)
    // The rotation will handle the visual orientation for side players
    const effectiveOrientation: FanOrientation = orientation ?? "horizontal";

    // Determine responsive card size based on position and screen size
    const responsiveSize: CardSize =
        size ??
        (() => {
            const isMobile = dimensions.width < 640;
            if (isLocalPlayer) {
                return isMobile ? "md" : "lg";
            }
            return isMobile ? "xs" : "sm";
        })();

    // For opponents, show card backs based on cardCount
    const displayCards: (PlayingCardType | null)[] =
        isLocalPlayer || cards.length > 0
            ? cards
            : Array(cardCount || 0).fill(null);

    const isHorizontal = effectiveOrientation === "horizontal";

    // Calculate available width for the hero's hand (account for some padding)
    const availableWidth = isLocalPlayer ? dimensions.width - 32 : undefined;

    const spacing = getCardSpacing(
        displayCards.length,
        responsiveSize,
        isHorizontal,
        availableWidth
    );

    // Calculate if the hand container needs different sizing based on rotation
    // For 90/-90 degree rotations, the hand will appear vertical
    const isRotatedSideways = Math.abs(rotation) === 90;

    // Calculate the actual width/height of the fanned card hand
    const cardDimensions = SIZE_DIMENSIONS[responsiveSize];
    const numCards = displayCards.length;
    // First card full width + (remaining cards * spacing)
    const totalHandWidth = isHorizontal
        ? cardDimensions.width +
          Math.max(0, numCards - 1) * (cardDimensions.width - spacing)
        : cardDimensions.width;
    const totalHandHeight = isHorizontal
        ? cardDimensions.height
        : cardDimensions.height +
          Math.max(0, numCards - 1) * (cardDimensions.height - spacing);

    return (
        <div
            className={cn("flex items-center justify-center", className)}
            style={{
                // Set explicit dimensions so the container centers properly
                width: isRotatedSideways ? totalHandHeight : totalHandWidth,
                height: isRotatedSideways ? totalHandWidth : totalHandHeight,
                // Ensure the hand never overflows the viewport for the hero
                maxWidth:
                    isLocalPlayer && !isRotatedSideways ? "100%" : undefined,
            }}
        >
            <div
                className={cn("flex", isHorizontal ? "flex-row" : "flex-col")}
                style={{
                    transform:
                        rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
                    transformOrigin: "center center",
                }}
            >
                <AnimatePresence mode="popLayout">
                    {displayCards.map((card, index) => (
                        <CardInHand
                            key={
                                card
                                    ? `${card.suit}-${card.rank}`
                                    : `back-${index}`
                            }
                            card={card}
                            index={index}
                            totalCards={displayCards.length}
                            isHidden={!isLocalPlayer}
                            isSelected={selectedIndex === index}
                            isDisabled={
                                disabledIndices.includes(index) || isDealing
                            }
                            isInteractive={interactive && isLocalPlayer}
                            size={responsiveSize}
                            spacing={spacing}
                            playerId={playerId}
                            isHorizontal={isHorizontal}
                            onClick={
                                onCardClick && card
                                    ? () => onCardClick(index, card)
                                    : undefined
                            }
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default CardHand;
