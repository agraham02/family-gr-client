"use client";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import React, { useEffect } from "react";
import Dominoes from "@/components/games/dominoes";
import Spades from "@/components/games/spades/index";
import {
    DominoesData,
    GameData,
    GameEventPayload,
    PlayerData,
    SpadesData,
    SpadesPlayerData,
} from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function GamePage() {
    const { roomId, userId } = useSession();
    const { socket, connected } = useWebSocket();
    // const { roomCode } = useParams();
    const [gameData, setGameData] = React.useState<GameData | null>(null);
    const [playerData, setPlayerData] = React.useState<PlayerData | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!socket || !connected || !roomId || !userId) return;

        function handleGameEvent(payload: GameEventPayload) {
            console.log("📨 Game event:", payload);
            switch (payload.event) {
                case "sync":
                    setGameData(payload.gameState);
                    break;
                case "player_sync":
                    setPlayerData(payload.playerState);
                    break;
                case "player_left":
                    toast.info(`${payload.userName} has left the game.`);
                    break;
                case "game_aborted":
                    toast.info(
                        `The game has been aborted. Returning to lobby.`
                    );
                    router.push(`/lobby/${roomId}`);
                    break;
            }
        }

        socket.on("game_event", handleGameEvent);

        socket.emit("get_game_state", { roomId, userId });
        socket.emit("get_player_state", { roomId, userId });

        return () => {
            socket.off("game_event", handleGameEvent);
        };
    }, [socket, connected, roomId, userId]);

    if (!gameData) {
        return <div>Loading...</div>;
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* <SpecificGame gameData={gameData} playerData={playerData} /> */}
            {gameData.type === "dominoes" && playerData && (
                <Dominoes
                    gameData={gameData as DominoesData}
                    playerData={playerData}
                />
            )}
            {gameData.type === "spades" && playerData && (
                <Spades
                    gameData={gameData as SpadesData}
                    playerData={playerData as SpadesPlayerData}
                />
            )}
            {/* Optionally handle unknown game types */}
            {gameData.type !== "dominoes" && gameData.type !== "spades" && (
                <div className="text-zinc-500 dark:text-zinc-400">
                    No game UI available
                </div>
            )}
        </main>
    );
}
