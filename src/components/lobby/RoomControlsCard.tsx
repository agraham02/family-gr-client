import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";
import {
    SettingsIcon,
    PlayIcon,
    DoorOpenIcon,
    TrophyIcon,
    AlertTriangleIcon,
} from "lucide-react";

export default function RoomControlsCard({
    selectedGame,
    isPartyLeader,
}: {
    selectedGame: string | null;
    isPartyLeader: boolean;
}) {
    const { socket, connected } = useWebSocket();
    const { userId, roomId } = useSession();

    // Game-specific settings
    const [dominoesWinTarget, setDominoesWinTarget] = useState<number>(100);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    function handleCloseRoom() {
        setShowCloseConfirm(true);
    }

    function confirmCloseRoom() {
        if (!socket || !connected) {
            toast.error("Not connected to the server");
            return;
        }
        socket.emit("close_room", { roomId, userId });
        toast.warning("Room closed");
        setShowCloseConfirm(false);
    }

    function handleStartGame() {
        if (!socket || !connected) {
            toast.error("Not connected to the server");
            return;
        }

        // Build game-specific settings
        let gameSettings: Record<string, unknown> | undefined;

        if (selectedGame === "dominoes") {
            gameSettings = {
                winTarget: dominoesWinTarget,
            };
        }

        socket.emit("start_game", {
            roomId,
            userId,
            gameType: selectedGame,
            gameSettings,
        });
    }

    return (
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-zinc-900/90 border-zinc-200/50 dark:border-zinc-700/50 shadow-lg">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <SettingsIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    Room Controls
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {/* Game-specific settings */}
                {isPartyLeader && selectedGame === "dominoes" && (
                    <div className="space-y-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                            <TrophyIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Dominoes Settings
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Label
                                htmlFor="winTarget"
                                className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap"
                            >
                                Win Target:
                            </Label>
                            <Input
                                id="winTarget"
                                type="number"
                                min={50}
                                max={500}
                                step={25}
                                value={dominoesWinTarget}
                                onChange={(e) =>
                                    setDominoesWinTarget(
                                        Math.max(
                                            50,
                                            Math.min(
                                                500,
                                                Number(e.target.value) || 100
                                            )
                                        )
                                    )
                                }
                                className="w-24 h-9"
                            />
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                points
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            First team to reach this score wins the game.
                        </p>
                    </div>
                )}

                {/* Start Game Button */}
                {isPartyLeader && (
                    <Button
                        onClick={handleStartGame}
                        disabled={!selectedGame}
                        className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlayIcon className="w-5 h-5" />
                        {selectedGame ? "Start Game" : "Select a Game First"}
                    </Button>
                )}

                <Separator className="my-1" />

                {/* Close Room Button */}
                <Button
                    variant="outline"
                    className="w-full h-10 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-800"
                    onClick={handleCloseRoom}
                >
                    <DoorOpenIcon className="w-4 h-4" />
                    Close Room
                </Button>

                {/* Close Room Confirmation Dialog */}
                <ConfirmDialog
                    open={showCloseConfirm}
                    title="Close Room"
                    description="Are you sure you want to close this room? All players will be disconnected."
                    confirmText="Close Room"
                    cancelText="Cancel"
                    variant="destructive"
                    onConfirm={confirmCloseRoom}
                    onCancel={() => setShowCloseConfirm(false)}
                />
            </CardContent>
        </Card>
    );
}
