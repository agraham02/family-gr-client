import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlayingCard } from "@/types";

const SUIT_MAP = {
    Spades: "♠",
    Hearts: "♥",
    Diamonds: "♦",
    Clubs: "♣",
};

interface CardProps {
    card: PlayingCard | null;
    hidden?: boolean;
    size?: "xs" | "sm" | "md" | "lg";
    asInteractive?: boolean;
    className?: string;
    orientation?: "horizontal" | "vertical";
    index?: number;
    onClick?: () => void;
}

const SIZE_MAP = {
    xs: { w: "w-8", h: "h-8" },
    sm: { w: "w-12", h: "h-12" },
    md: { w: "w-18", h: "h-18" },
    lg: { w: "w-24", h: "h-24" },
};

const TEXT_SIZE_MAP = {
    xs: {
        corner: "text-[0.5rem]",
        center: "text-sm",
    },
    sm: {
        corner: "text-xs",
        center: "text-base",
    },
    md: {
        corner: "text-sm",
        center: "text-xl",
    },
    lg: {
        corner: "text-base",
        center: "text-2xl",
    },
};

function CardComponent({
    card,
    hidden = false,
    size = "md",
    asInteractive = false,
    className,
    orientation = "vertical",
    index = 0,
    onClick,
}: CardProps) {
    // If card is null, always show the back
    const showBack = card === null || hidden;
    const isRed = card && (card.suit === "Hearts" || card.suit === "Diamonds");

    const sizeClass =
        orientation === "horizontal"
            ? `${SIZE_MAP[size].h} aspect-[7/5]`
            : `${SIZE_MAP[size].w} aspect-[5/7]`;
    const textSize = TEXT_SIZE_MAP[size];

    return (
        <div
            className={cn(
                sizeClass,
                "shrink-0 shadow-md bg-white text-black font-semibold flex rounded-sm",
                asInteractive &&
                    "hover:scale-[1.02] active:scale-[0.98] transition-transform duration-100 cursor-pointer",
                className
            )}
            style={{ zIndex: index }}
            role="img"
            aria-label={
                showBack
                    ? "Hidden card"
                    : card
                    ? `${card.rank} of ${card.suit}`
                    : "Hidden card"
            }
            onClick={
                asInteractive && typeof onClick === "function"
                    ? onClick
                    : undefined
            }
            tabIndex={
                asInteractive && typeof onClick === "function" ? 0 : undefined
            }
        >
            {!showBack && card && (
                <div className="flex flex-col w-full h-full px-1.5 py-1">
                    <div
                        className={cn(
                            textSize.corner,
                            "self-start",
                            isRed && "text-red-500"
                        )}
                    >
                        {card.rank}
                        {SUIT_MAP[card.suit]}
                    </div>

                    <div
                        className={cn(
                            textSize.center,
                            "flex-grow flex items-center justify-center",
                            isRed && "text-red-500"
                        )}
                    >
                        {SUIT_MAP[card.suit]}
                    </div>

                    <div
                        className={cn(
                            textSize.corner,
                            "rotate-180 self-end",
                            isRed && "text-red-500"
                        )}
                    >
                        {card.rank}
                        {SUIT_MAP[card.suit]}
                    </div>
                </div>
            )}
            {showBack && (
                <div
                    className={cn(
                        "relative flex items-center justify-center h-full w-full"
                    )}
                >
                    <Image
                        src={`/images/card-back${
                            orientation === "horizontal" ? "-side" : ""
                        }.png`}
                        alt="Card Back"
                        fill
                        className="rounded-sm shadow-md"
                        priority
                    />
                </div>
            )}
        </div>
    );
}

// export default memo(CardComponent, (prev, next) => {
//     return (
//         prev.hidden === next.hidden &&
//         prev.card.rank === next.card.rank &&
//         prev.card.suit === next.card.suit
//     );
// });

export default CardComponent;
