"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "@/types";
import { Loader2, UserX, Clock } from "lucide-react";

interface GamePausedOverlayProps {
    isPaused: boolean;
    disconnectedPlayers: User[];
    timeoutAt: string | null;
    isLeader: boolean;
    onKickPlayer?: (userId: string) => void;
    onLeaveGame?: () => void;
}

export default function GamePausedOverlay({
    isPaused,
    disconnectedPlayers,
    timeoutAt,
    isLeader,
    onKickPlayer,
    onLeaveGame,
}: GamePausedOverlayProps) {
    const [timeRemaining, setTimeRemaining] = useState<string>("");

    useEffect(() => {
        if (!isPaused || !timeoutAt) {
            setTimeRemaining("");
            return;
        }

        function updateCountdown() {
            const now = new Date().getTime();
            const timeout = new Date(timeoutAt!).getTime();
            const diff = timeout - now;

            if (diff <= 0) {
                setTimeRemaining("0:00");
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeRemaining(
                `${minutes}:${seconds.toString().padStart(2, "0")}`
            );
        }

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [isPaused, timeoutAt]);

    return (
        <Dialog open={isPaused}>
            <DialogContent className="flex flex-col items-center gap-6 max-w-md">
                <DialogTitle className="sr-only">Game Paused</DialogTitle>
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
                    <h2 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        Game Paused
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400 text-center">
                        Waiting for disconnected players to rejoin...
                    </p>
                </div>

                {/* Countdown Timer */}
                {timeRemaining && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm text-amber-700 dark:text-amber-300">
                            Auto-abort in{" "}
                            <span className="font-bold text-lg">
                                {timeRemaining}
                            </span>
                        </span>
                    </div>
                )}

                {/* Disconnected Players List */}
                {disconnectedPlayers.length > 0 && (
                    <div className="w-full">
                        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                            Disconnected Players
                        </h3>
                        <div className="flex flex-col gap-2">
                            {disconnectedPlayers.map((player) => (
                                <div
                                    key={player.id}
                                    className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <UserX className="h-5 w-5 text-red-500" />
                                        <span className="font-medium text-red-700 dark:text-red-300">
                                            {player.name}
                                        </span>
                                    </div>
                                    {isLeader && onKickPlayer && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                                onKickPlayer(player.id)
                                            }
                                        >
                                            Kick
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Leave Game Button */}
                {onLeaveGame && (
                    <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={onLeaveGame}
                    >
                        Leave Game
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
}
