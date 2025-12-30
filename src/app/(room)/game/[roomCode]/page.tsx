"use client";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import React, { useEffect, useState, useCallback } from "react";
import GamePausedOverlay from "@/components/games/GamePausedOverlay";
import { getGameComponent } from "@/components/games/registry";
import { GameSkeleton } from "@/components/skeletons";
import {
    GameData,
    GameEventPayload,
    PlayerData,
    User,
    RoomEventPayload,
} from "@/types";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

export default function GamePage() {
    const { roomId, userId, clearRoomSession } = useSession();
    const { socket, connected } = useWebSocket();
    const { roomCode } = useParams();
    const [gameData, setGameData] = useState<GameData | null>(null);
    const [playerData, setPlayerData] = useState<PlayerData | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [timeoutAt, setTimeoutAt] = useState<string | null>(null);
    const [disconnectedPlayers, setDisconnectedPlayers] = useState<User[]>([]);
    const [leaderId, setLeaderId] = useState<string | null>(null);
    const router = useRouter();

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
                    if (socket)
                        socket.emit("get_player_state", { roomId, userId });
                    break;
                case "player_sync":
                    setPlayerData(payload.playerState);
                    break;
                case "player_left":
                    toast.info(`${payload.userName} has left the game.`);
                    break;
                case "game_aborted":
                    setIsPaused(false);
                    setTimeoutAt(null);
                    setDisconnectedPlayers([]);
                    if (payload.reason === "reconnect_timeout") {
                        toast.warning(
                            "Game aborted: Players did not reconnect in time."
                        );
                    } else {
                        toast.info(
                            "The game has been aborted. Returning to lobby."
                        );
                    }
                    router.push(`/lobby/${roomCode}`);
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
                    toast.warning(
                        `${payload.userName || "A player"} disconnected.`
                    );
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
                    toast.success(
                        `${payload.userName || "A player"} reconnected!`
                    );
                    // Remove from disconnected list
                    setDisconnectedPlayers((prev) =>
                        prev.filter((p) => p.id !== payload.userId)
                    );
                    break;
            }
        },
        [socket, roomId, userId, router, roomCode]
    );

    const handleRoomEvent = useCallback(
        (payload: RoomEventPayload) => {
            console.log("📨 Room event (game page):", payload);
            switch (payload.event) {
                case "leader_promoted":
                    setLeaderId(payload.newLeaderId);
                    if (payload.newLeaderId === userId) {
                        toast.info("You are now the room leader!");
                    } else {
                        toast.info(
                            `${payload.newLeaderName} is now the room leader.`
                        );
                    }
                    break;
                case "game_aborted":
                    setIsPaused(false);
                    setTimeoutAt(null);
                    setDisconnectedPlayers([]);
                    router.push(`/lobby/${roomCode}`);
                    break;
                case "user_kicked":
                    // Check if the current user was kicked
                    if (payload.userId === userId) {
                        toast.error("You have been kicked from the game.");
                        clearRoomSession();
                        router.push("/");
                    } else {
                        toast.info(
                            `${
                                payload.userName || "A player"
                            } was kicked from the game.`
                        );
                        // Remove from disconnected list if they were there
                        setDisconnectedPlayers((prev) =>
                            prev.filter((p) => p.id !== payload.userId)
                        );
                    }
                    break;
            }
        },
        [userId, router, roomCode]
    );

    useEffect(() => {
        if (!socket || !connected || !roomId || !userId) return;

        socket.on("game_event", handleGameEvent);
        socket.on("room_event", handleRoomEvent);

        socket.emit("get_game_state", { roomId, userId });
        socket.emit("get_player_state", { roomId, userId });

        return () => {
            socket.off("game_event", handleGameEvent);
            socket.off("room_event", handleRoomEvent);
        };
    }, [socket, connected, roomId, userId, handleGameEvent, handleRoomEvent]);

    function handleKickPlayer(targetUserId: string) {
        if (!socket || !roomId) return;
        socket.emit("kick_user", { roomId, userId, targetUserId });
    }

    function handleLeaveGame() {
        router.push(`/lobby/${roomCode}`);
    }

    if (!gameData) {
        return <GameSkeleton />;
    }

    const isLeader = leaderId === userId;

    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
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
                    <div className="text-zinc-500 dark:text-zinc-400">
                        No game UI available for &quot;{gameData.type}&quot;
                    </div>
                );
            })()}
        </main>
    );
}
