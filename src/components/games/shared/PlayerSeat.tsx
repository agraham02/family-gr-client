"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export type SeatPosition =
    | "bottom"
    | "top"
    | "left"
    | "right"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

interface PlayerSeatProps {
    playerId: string;
    playerName: string;
    isCurrentTurn: boolean;
    isLocalPlayer?: boolean;
    position: SeatPosition;
    bid?: number | null;
    tricksWon?: number;
    teamColor?: string;
    connected?: boolean;
    className?: string;
}

// Layout configuration based on seat position
// This controls the internal layout of the player info badge
const SEAT_LAYOUTS: Record<
    SeatPosition,
    {
        flexDirection: string;
        avatarOrder: number;
        infoAlign: string;
    }
> = {
    bottom: {
        flexDirection: "flex-col",
        avatarOrder: 1,
        infoAlign: "items-center",
    },
    top: {
        flexDirection: "flex-col",
        avatarOrder: 0,
        infoAlign: "items-center",
    },
    left: {
        flexDirection: "flex-row-reverse",
        avatarOrder: 0,
        infoAlign: "items-end",
    },
    right: {
        flexDirection: "flex-row",
        avatarOrder: 0,
        infoAlign: "items-start",
    },
    "top-left": {
        flexDirection: "flex-row-reverse",
        avatarOrder: 0,
        infoAlign: "items-end",
    },
    "top-right": {
        flexDirection: "flex-row",
        avatarOrder: 0,
        infoAlign: "items-start",
    },
    "bottom-left": {
        flexDirection: "flex-row-reverse",
        avatarOrder: 0,
        infoAlign: "items-end",
    },
    "bottom-right": {
        flexDirection: "flex-row",
        avatarOrder: 0,
        infoAlign: "items-start",
    },
};

// Get initials from player name
function getInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");
}

// Turn indicator component with pulsing animation
function TurnIndicator({
    isActive,
    className,
}: {
    isActive: boolean;
    className?: string;
}) {
    if (!isActive) return null;

    return (
        <motion.div
            className={cn("absolute inset-0 rounded-full", className)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.15, 1],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            style={{
                background:
                    "radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, transparent 70%)",
                boxShadow: "0 0 20px 5px rgba(251, 191, 36, 0.4)",
            }}
        />
    );
}

function PlayerSeat({
    playerId,
    playerName,
    isCurrentTurn,
    isLocalPlayer = false,
    position,
    bid,
    tricksWon,
    teamColor,
    connected = true,
    className,
}: PlayerSeatProps) {
    const layout = SEAT_LAYOUTS[position];
    const initials = getInitials(playerName);

    // Determine avatar size based on position - smaller on mobile
    const isBottom = position === "bottom";
    const avatarSize = isBottom
        ? "h-10 w-10 md:h-12 md:w-12"
        : "h-8 w-8 md:h-10 md:w-10";

    return (
        <motion.div
            className={cn(
                "flex gap-1 md:gap-2",
                layout.flexDirection,
                layout.infoAlign,
                className
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Avatar with turn indicator */}
            <div className="relative" style={{ order: layout.avatarOrder }}>
                <TurnIndicator isActive={isCurrentTurn} />
                <Avatar
                    className={cn(
                        avatarSize,
                        "border-2 transition-all duration-300",
                        isCurrentTurn
                            ? "border-amber-400 shadow-lg shadow-amber-400/30"
                            : "border-white/20",
                        !connected && "opacity-50 grayscale"
                    )}
                    style={{
                        borderColor: isCurrentTurn ? undefined : teamColor,
                    }}
                >
                    <AvatarFallback
                        className={cn(
                            "text-sm font-semibold",
                            isLocalPlayer
                                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                                : "bg-gradient-to-br from-slate-600 to-slate-700 text-white"
                        )}
                    >
                        {initials}
                    </AvatarFallback>
                </Avatar>

                {/* Connection status dot */}
                {!connected && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}
            </div>

            {/* Player info */}
            <div
                className={cn(
                    "flex flex-col gap-0.5 md:gap-1",
                    layout.infoAlign
                )}
            >
                <span
                    className={cn(
                        "text-xs md:text-sm font-medium truncate max-w-[70px] md:max-w-[100px]",
                        isCurrentTurn ? "text-amber-400" : "text-white/90",
                        isLocalPlayer && "font-bold"
                    )}
                >
                    {playerName}
                    {isLocalPlayer && " (You)"}
                </span>

                {/* Bid and tricks badges */}
                {(bid !== undefined || tricksWon !== undefined) && (
                    <div className="flex gap-0.5 md:gap-1 flex-wrap">
                        {bid !== undefined && bid !== null && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] md:text-xs px-1 md:px-1.5 py-0 h-4 md:h-5 bg-slate-700/80 text-white"
                            >
                                Bid: {bid}
                            </Badge>
                        )}
                        {tricksWon !== undefined && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] md:text-xs px-1 md:px-1.5 py-0 h-4 md:h-5 bg-emerald-700/80 text-white"
                            >
                                Won: {tricksWon}
                            </Badge>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default PlayerSeat;
