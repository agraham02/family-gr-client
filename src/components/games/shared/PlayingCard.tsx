"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "motion/react";
import { PlayingCard as PlayingCardType } from "@/types";

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

export type CardSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_DIMENSIONS: Record<CardSize, { width: number; height: number }> = {
    xs: { width: 40, height: 56 },
    sm: { width: 52, height: 73 },
    md: { width: 70, height: 98 },
    lg: { width: 90, height: 126 },
    xl: { width: 110, height: 154 },
};

const TEXT_SIZES: Record<CardSize, { corner: string; center: string }> = {
    xs: { corner: "text-[0.5rem]", center: "text-sm" },
    sm: { corner: "text-[0.625rem]", center: "text-base" },
    md: { corner: "text-xs", center: "text-xl" },
    lg: { corner: "text-sm", center: "text-2xl" },
    xl: { corner: "text-base", center: "text-3xl" },
};

interface PlayingCardProps {
    card: PlayingCardType | null;
    hidden?: boolean;
    size?: CardSize;
    selected?: boolean;
    disabled?: boolean;
    highlighted?: boolean;
    interactive?: boolean;
    rotation?: number;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    layoutId?: string;
}

function PlayingCard({
    card,
    hidden = false,
    size = "md",
    selected = false,
    disabled = false,
    highlighted = false,
    interactive = false,
    rotation = 0,
    className,
    style,
    onClick,
    layoutId,
}: PlayingCardProps) {
    const showBack = card === null || hidden;
    const dimensions = SIZE_DIMENSIONS[size];
    const textSize = TEXT_SIZES[size];

    const cardContent = (
        <motion.div
            layoutId={layoutId}
            className={cn(
                "relative rounded-lg shadow-lg bg-white border border-gray-200 overflow-hidden select-none",
                interactive && !disabled && "cursor-pointer",
                selected && "ring-2 ring-blue-500 ring-offset-2",
                highlighted && "ring-2 ring-yellow-400",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            style={{
                width: dimensions.width,
                height: dimensions.height,
                rotate: `${rotation}deg`,
                ...style,
            }}
            whileHover={
                interactive && !disabled
                    ? { y: -8, scale: 1.02, transition: { duration: 0.15 } }
                    : undefined
            }
            whileTap={interactive && !disabled ? { scale: 0.98 } : undefined}
            onClick={interactive && !disabled ? onClick : undefined}
            role={interactive ? "button" : "img"}
            aria-label={
                showBack
                    ? "Hidden card"
                    : card
                    ? `${card.rank} of ${card.suit}`
                    : "Hidden card"
            }
            tabIndex={interactive && !disabled ? 0 : undefined}
        >
            {/* Card Face */}
            {!showBack && card && (
                <div className="absolute inset-0 flex flex-col p-1">
                    {/* Top-left corner */}
                    <div
                        className={cn(
                            textSize.corner,
                            "font-bold leading-tight flex flex-col items-center",
                            SUIT_COLORS[card.suit]
                        )}
                    >
                        <span>{card.rank}</span>
                        <span className="-mt-0.5">{SUIT_MAP[card.suit]}</span>
                    </div>

                    {/* Center suit */}
                    <div
                        className={cn(
                            textSize.center,
                            "flex-1 flex items-center justify-center",
                            SUIT_COLORS[card.suit]
                        )}
                    >
                        {SUIT_MAP[card.suit]}
                    </div>

                    {/* Bottom-right corner (rotated) */}
                    <div
                        className={cn(
                            textSize.corner,
                            "font-bold leading-tight flex flex-col items-center rotate-180",
                            SUIT_COLORS[card.suit]
                        )}
                    >
                        <span>{card.rank}</span>
                        <span className="-mt-0.5">{SUIT_MAP[card.suit]}</span>
                    </div>
                </div>
            )}

            {/* Card Back */}
            {showBack && (
                <div className="absolute inset-0">
                    <Image
                        src="/images/card-back.png"
                        alt="Card Back"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            )}

            {/* Selection glow effect */}
            {selected && (
                <motion.div
                    className="absolute inset-0 bg-blue-500/10 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />
            )}
        </motion.div>
    );

    return cardContent;
}

export default PlayingCard;
