import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";

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
        <Card className="bg-white dark:bg-zinc-900 shadow-md">
            <CardHeader>
                <CardTitle>Room Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {/* Game-specific settings */}
                {isPartyLeader && selectedGame === "dominoes" && (
                    <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Dominoes Settings
                        </div>
                        <div className="flex items-center gap-3">
                            <label
                                htmlFor="winTarget"
                                className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap"
                            >
                                Win Target:
                            </label>
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
                                className="w-24"
                            />
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                points
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            First player to reach this score wins the game.
                        </p>
                    </div>
                )}

                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCloseRoom}
                >
                    Close Room
                </Button>
                {isPartyLeader && (
                    <Button className="w-full" onClick={handleStartGame}>
                        Start Game
                    </Button>
                )}

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
