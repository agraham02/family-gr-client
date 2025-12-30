"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronUp, Trophy, Target, Award } from "lucide-react";

interface TeamScore {
    teamId: string;
    teamName: string;
    players: string[];
    score: number;
    bags?: number;
    roundScore?: number;
}

interface PlayerBid {
    playerId: string;
    playerName: string;
    bid: number | null;
    tricksWon: number;
    teamId?: string;
}

interface GameScoreboardProps {
    teams: TeamScore[];
    playerBids?: PlayerBid[];
    round: number;
    phase: string;
    winTarget?: number;
    className?: string;
}

// Score display with animated changes
function AnimatedScore({
    score,
    className,
}: {
    score: number;
    className?: string;
}) {
    return (
        <motion.span
            key={score}
            initial={{ scale: 1.2, color: "#22c55e" }}
            animate={{ scale: 1, color: "inherit" }}
            transition={{ duration: 0.3 }}
            className={className}
        >
            {score}
        </motion.span>
    );
}

// Desktop floating scoreboard
function DesktopScoreboard({
    teams,
    playerBids,
    round,
    phase,
    winTarget,
    className,
}: GameScoreboardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            className={cn(
                "fixed top-4 right-4 z-50 hidden md:block",
                "bg-slate-900/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl",
                "min-w-[200px] max-w-[280px]",
                className
            )}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between p-3 border-b border-white/10 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-white">
                        Scoreboard
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">Round {round}</span>
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronUp className="w-4 h-4 text-white/60" />
                    </motion.div>
                </div>
            </div>

            {/* Team scores - always visible */}
            <div className="p-3 space-y-2">
                {teams.map((team, index) => (
                    <div
                        key={team.teamId}
                        className={cn(
                            "flex items-center justify-between p-2 rounded-lg",
                            index === 0 ? "bg-blue-500/20" : "bg-red-500/20"
                        )}
                    >
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">
                                {team.teamName}
                            </span>
                            <span className="text-xs text-white/60">
                                {team.players.join(" & ")}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <AnimatedScore
                                score={team.score}
                                className="text-lg font-bold text-white"
                            />
                            {team.bags !== undefined && (
                                <span className="text-xs text-white/60">
                                    Bags: {team.bags}
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {winTarget && (
                    <div className="flex items-center justify-center gap-1 text-xs text-white/40 pt-1">
                        <Target className="w-3 h-3" />
                        <span>Playing to {winTarget}</span>
                    </div>
                )}
            </div>

            {/* Expanded: Player bids */}
            <AnimatePresence>
                {isExpanded && playerBids && playerBids.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-white/10"
                    >
                        <div className="p-3 space-y-1">
                            <div className="flex items-center gap-1 text-xs text-white/60 mb-2">
                                <Award className="w-3 h-3" />
                                <span>Bids & Tricks</span>
                            </div>
                            {playerBids.map((player) => (
                                <div
                                    key={player.playerId}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="text-white/80 truncate max-w-[120px]">
                                        {player.playerName}
                                    </span>
                                    <div className="flex gap-2">
                                        <span className="text-white/60">
                                            Bid: {player.bid ?? "-"}
                                        </span>
                                        <span
                                            className={cn(
                                                player.tricksWon >=
                                                    (player.bid ?? 0)
                                                    ? "text-emerald-400"
                                                    : "text-white/60"
                                            )}
                                        >
                                            Won: {player.tricksWon}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Mobile bottom sheet scoreboard
function MobileScoreboard({
    teams,
    playerBids,
    round,
    phase,
    winTarget,
}: GameScoreboardProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="md:hidden fixed bottom-20 right-4 z-50 bg-slate-900/90 border-white/20 text-white hover:bg-slate-800"
                >
                    <Trophy className="w-4 h-4 mr-1 text-amber-400" />
                    Scores
                </Button>
            </SheetTrigger>
            <SheetContent
                side="bottom"
                className="bg-slate-900 border-white/10"
            >
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-white">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        Round {round} - Scoreboard
                    </SheetTitle>
                </SheetHeader>

                <div className="py-4 space-y-4">
                    {/* Team scores */}
                    <div className="grid grid-cols-2 gap-3">
                        {teams.map((team, index) => (
                            <div
                                key={team.teamId}
                                className={cn(
                                    "p-3 rounded-xl",
                                    index === 0
                                        ? "bg-blue-500/20"
                                        : "bg-red-500/20"
                                )}
                            >
                                <div className="text-sm font-medium text-white mb-1">
                                    {team.teamName}
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {team.score}
                                </div>
                                {team.bags !== undefined && (
                                    <div className="text-xs text-white/60">
                                        Bags: {team.bags}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Player bids */}
                    {playerBids && playerBids.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-1 text-sm text-white/60">
                                <Award className="w-4 h-4" />
                                <span>Bids & Tricks</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {playerBids.map((player) => (
                                    <div
                                        key={player.playerId}
                                        className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2"
                                    >
                                        <span className="text-sm text-white/80 truncate">
                                            {player.playerName}
                                        </span>
                                        <span className="text-sm text-white/60">
                                            {player.bid ?? "-"}/
                                            {player.tricksWon}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {winTarget && (
                        <div className="flex items-center justify-center gap-1 text-sm text-white/40">
                            <Target className="w-4 h-4" />
                            <span>Playing to {winTarget}</span>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function GameScoreboard(props: GameScoreboardProps) {
    return (
        <>
            <DesktopScoreboard {...props} />
            <MobileScoreboard {...props} />
        </>
    );
}

export default GameScoreboard;
