"use client";

import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import React, { useEffect, useState, useCallback } from "react";
import GamePausedOverlay from "@/components/games/GamePausedOverlay";
import { getGameComponent } from "@/components/games/registry";
import { GameSkeleton } from "@/components/skeletons";
import { GameData, GameEventPayload, PlayerData, User } from "@/types";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { useRoomEvents } from "@/hooks/useRoomEvents";
import { getSocket, emitJoinRoom } from "@/lib/socket";

export default function GamePage() {
    const { roomId, userId } = useSession();
    const { socket, connected, emit } = useWebSocket();
    const { roomCode }: { roomCode: string } = useParams();
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [timeoutAt, setTimeoutAt] = useState<string | null>(null);
    const [disconnectedPlayers, setDisconnectedPlayers] = useState<User[]>([]);
    const [leaderId, setLeaderId] = useState<string | null>(null);
    const router = useRouter();

    // Use shared room events hook for common events
    useRoomEvents({
        roomCode,
        autoNavigateOnGameStart: false, // Already on game page
        onSync: (roomState) => {
            // Update leader from room state
            setLeaderId(roomState.leaderId);
            // If room is in lobby state, redirect back to lobby
            if (roomState.state === "lobby") {
                toast.info("Game ended. Returning to lobby.");
                router.push(`/lobby/${roomCode}`);
            }
        },
        onGameAborted: () => {
            setIsPaused(false);
            setTimeoutAt(null);
            setDisconnectedPlayers([]);
            router.push(`/lobby/${roomCode}`);
        },
    });

    // Handle game-specific events
    const handleGameEvent = useCallback(
        (payload: GameEventPayload) => {
            console.log("📨 Game event:", payload);
            switch (payload.event) {
                case "sync":
                    setGameData(payload.gameState);
                    setLeaderId(payload.gameState.leaderId);
                    // Update disconnected players from game state
                    const disconnected = Object.values(
                        payload.gameState.players
                    ).filter((p) => p.isConnected === false);
                    setDisconnectedPlayers(disconnected);
                    // Request player-specific state
                    emit("get_player_state", { roomId, userId });
                    break;
                case "player_sync":
                    setPlayerData(payload.playerState);
                    break;
                case "player_left":
                    toast.info(`${payload.userName} has left the game.`);
                    break;
                case "game_paused":
                    setIsPaused(true);
                    setTimeoutAt(payload.timeoutAt);
                    toast.warning(
                        "Game paused: Waiting for players to reconnect..."
                    );
                    break;
                case "game_resumed":
                    setIsPaused(false);
                    setTimeoutAt(null);
                    setDisconnectedPlayers([]);
                    toast.success("Game resumed!");
                    break;
                case "user_disconnected":
                    // Add to disconnected list if not already there
                    setDisconnectedPlayers((prev) => {
                        if (prev.some((p) => p.id === payload.userId))
                            return prev;
                        return [
                            ...prev,
                            {
                                id: payload.userId,
                                name: payload.userName || "Unknown",
                                isConnected: false,
                            },
                        ];
                    });
                    break;
                case "user_reconnected":
                    // Remove from disconnected list
                    setDisconnectedPlayers((prev) =>
                        prev.filter((p) => p.id !== payload.userId)
                    );
                    break;
            }
        },
        [emit, roomId, userId]
    );

    // Set up game event listeners
    useEffect(() => {
        if (!roomId || !userId) return;

        const sock = getSocket();

        sock.on("game_event", handleGameEvent);

        // Request game state when connected
        const requestGameState = () => {
            sock.emit("get_game_state", { roomId, userId });
            sock.emit("get_player_state", { roomId, userId });
        };

        if (sock.connected) {
            requestGameState();
        } else {
            sock.on("connect", requestGameState);
        }

        return () => {
            sock.off("game_event", handleGameEvent);
            sock.off("connect", requestGameState);
        };
    }, [roomId, userId, handleGameEvent]);

    function handleKickPlayer(targetUserId: string) {
        emit("kick_user", { roomId, userId, targetUserId });
    }

    function handleLeaveGame() {
        router.push(`/lobby/${roomCode}`);
    }

    if (!gameData) {
        return <GameSkeleton />;
    }

    const isLeader = leaderId === userId;

    return (
        <main className="h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            {/* Game Paused Overlay */}
            <GamePausedOverlay
                isPaused={isPaused}
                disconnectedPlayers={disconnectedPlayers}
                timeoutAt={timeoutAt}
                isLeader={isLeader}
                onKickPlayer={handleKickPlayer}
                onLeaveGame={handleLeaveGame}
            />

            {/* Game UI */}
            {(() => {
                const GameComponent = getGameComponent(gameData.type);
                if (GameComponent && playerData) {
                    return (
                        <GameComponent
                            gameData={gameData}
                            playerData={playerData}
                        />
                    );
                }
                return (
                    <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                        No game UI available for &quot;{gameData.type}&quot;
                    </div>
                );
            })()}
        </main>
    );
}
