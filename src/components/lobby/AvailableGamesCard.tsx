import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { GameTypeMetadata, LobbyData } from "@/types";
import { useSession } from "@/contexts/SessionContext";
import { getAvailableGames } from "@/services/lobby";
import { toast } from "sonner";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function AvailableGamesCard({
    lobbyData,
}: {
    lobbyData: LobbyData;
}) {
    const [availableGames, setAvailableGames] = useState<GameTypeMetadata[]>(
        []
    );

    const { socket, connected } = useWebSocket();
    const { userId, roomId } = useSession();
    const leaderId = lobbyData.leaderId;
    const isPartyLeader = userId === leaderId;
    const [selectedGame, setSelectedGame] = useState<string | null>(
        lobbyData.selectedGameType
    );

    useEffect(() => {
        const fetchAvailableGames = async () => {
            try {
                const { games } = await getAvailableGames();
                console.log(games);
                setAvailableGames(games);
            } catch (error) {
                if (error instanceof Error && error.message) {
                    toast.error(
                        "Failed to load available games: " + error.message
                    );
                } else {
                    toast.error("Failed to load available games");
                }
            }
        };
        fetchAvailableGames();
    }, []);

    useEffect(() => {
        setSelectedGame(lobbyData.selectedGameType);
    }, [lobbyData.selectedGameType]);

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
                        className={`w-full justify-start ${
                            selectedGame === game.type
                                ? "bg-blue-500 text-white dark:bg-blue-600"
                                : ""
                        }`}
                        onClick={
                            isPartyLeader
                                ? () => handleSelectGame(game.type)
                                : undefined
                        }
                        disabled={!isPartyLeader}
                        aria-disabled={!isPartyLeader}
                    >
                        {game.displayName}
                        {selectedGame === game.type && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-700 text-white dark:bg-blue-800">
                                Selected
                            </span>
                        )}
                        <span className="ml-auto text-xs">
                            {game.minPlayers} - {game.maxPlayers} players
                        </span>
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}
