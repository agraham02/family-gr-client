import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { GameTypeMetadata } from "@/types";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { cn } from "@/lib/utils";

export default function AvailableGamesCard({
    availableGames,
    selectedGame,
    isPartyLeader,
}: {
    availableGames: GameTypeMetadata[];
    selectedGame: string | null;
    isPartyLeader: boolean;
}) {
    const { socket, connected } = useWebSocket();
    const { userId, roomId } = useSession();

    function handleSelectGame(gameType: string) {
        if (!socket || !connected) {
            toast.error("Not connected to the server");
            return;
        }

        socket.emit("select_game", { roomId, userId, gameType });
    }

    return (
        <Card className="bg-white dark:bg-zinc-900 shadow-md">
            <CardHeader>
                <CardTitle>Available Games</CardTitle>
                {!isPartyLeader && (
                    <span className="py-0.5 text-xs text-zinc-700 dark:text-zinc-300">
                        Only leader can change
                    </span>
                )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {availableGames.map((game) => (
                    <Button
                        key={game.type}
                        variant={
                            selectedGame === game.type ? "default" : "outline"
                        }
                        className={cn(
                            "w-full h-fit justify-start",
                            selectedGame === game.type
                                ? "bg-blue-500 text-white dark:bg-blue-600"
                                : ""
                        )}
                        onClick={
                            isPartyLeader
                                ? () => handleSelectGame(game.type)
                                : undefined
                        }
                        disabled={!isPartyLeader}
                        aria-disabled={!isPartyLeader}
                    >
                        <div className="flex w-full flex-col items-start gap-1 min-w-0 p-2">
                            <div className="flex w-full flex-wrap items-center gap-3 min-w-0">
                                <span className="truncate min-w-0 font-medium">
                                    {game.displayName}
                                </span>
                                <span className="text-xs whitespace-nowrap opacity-75">
                                    {game.minPlayers === game.maxPlayers
                                        ? `${game.minPlayers} players`
                                        : `${game.minPlayers} - ${game.maxPlayers} players`}
                                </span>
                            </div>
                            {game.description && (
                                <span
                                    className={cn(
                                        "text-xs text-left",
                                        selectedGame === game.type
                                            ? "text-blue-100"
                                            : "text-zinc-500 dark:text-zinc-400"
                                    )}
                                >
                                    {game.description}
                                </span>
                            )}
                        </div>
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}
