// src/hooks/useRoomEvents.ts
// Centralized room event handling hook - DRY principle

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSocket, emitJoinRoom } from "@/lib/socket";
import { useSession } from "@/contexts/SessionContext";
import { RoomEventPayload, LobbyData } from "@/types";

interface UseRoomEventsOptions {
    /** Called when room state is synced */
    onSync?: (roomState: LobbyData) => void;
    /** Called when game starts - return false to prevent default navigation */
    onGameStarted?: (
        payload: RoomEventPayload & { event: "game_started" }
    ) => boolean | void;
    /** Called when game is aborted */
    onGameAborted?: (reason: string) => void;
    /** Whether to auto-navigate on game_started (default: true) */
    autoNavigateOnGameStart?: boolean;
    /** Room code for navigation */
    roomCode: string;
    /** Whether this user is currently a spectator (affects navigation) */
    isSpectator?: boolean;
}

/**
 * Hook to handle common room events across lobby and game pages.
 * Reduces duplication and ensures consistent behavior.
 */
export function useRoomEvents(options: UseRoomEventsOptions) {
    const {
        onSync,
        onGameStarted,
        onGameAborted,
        autoNavigateOnGameStart = true,
        roomCode,
        isSpectator = false,
    } = options;

    const router = useRouter();
    const { roomId, userId, clearRoomSession } = useSession();

    // Use refs for callbacks to avoid effect re-runs when callbacks change
    const onSyncRef = useRef(onSync);
    const onGameStartedRef = useRef(onGameStarted);
    const onGameAbortedRef = useRef(onGameAborted);
    const hasJoinedRef = useRef(false);

    // Keep refs up to date
    useEffect(() => {
        onSyncRef.current = onSync;
        onGameStartedRef.current = onGameStarted;
        onGameAbortedRef.current = onGameAborted;
    });

    const handleRoomEvent = useCallback(
        (payload: RoomEventPayload) => {
            console.log("📨 Room event:", payload.event, payload);

            // Always call onSync for any event that includes room state
            if (onSyncRef.current) {
                onSyncRef.current(payload.roomState);
            }

            switch (payload.event) {
                case "sync":
                    // If room is in-game and we're on lobby, redirect to game
                    // But only if we're an active player, not a spectator
                    if (
                        payload.roomState.state === "in-game" &&
                        !isSpectator &&
                        !payload.roomState.spectators?.includes(userId || "")
                    ) {
                        toast.info("Rejoining active game...");
                        router.push(`/game/${roomCode}`);
                    }
                    break;

                case "game_started": {
                    const shouldNavigate =
                        onGameStartedRef.current?.(payload) !== false;
                    if (shouldNavigate && autoNavigateOnGameStart) {
                        toast.info(`Starting ${payload.gameType} game...`);
                        router.push(`/game/${roomCode}`);
                    }
                    break;
                }

                case "user_joined":
                    toast.info(`${payload.userName} joined the room`);
                    break;

                case "user_left":
                    if (payload.voluntary) {
                        toast.info(`${payload.userName} left the game`);
                    } else {
                        toast.info(
                            `${payload.userName} was removed from the room`
                        );
                    }
                    break;

                case "room_closed":
                    toast.warning("Room has been closed by the leader");
                    clearRoomSession();
                    router.push("/");
                    break;

                case "user_kicked":
                    if (payload.userId === userId) {
                        toast.error("You have been kicked from the room.");
                        clearRoomSession();
                        router.push("/");
                    } else {
                        toast.info(
                            `${
                                payload.userName || "A player"
                            } was kicked from the room.`
                        );
                    }
                    break;

                case "leader_promoted":
                    if (payload.newLeaderId === userId) {
                        toast.info("You are now the room leader!");
                    } else {
                        toast.info(
                            `${payload.newLeaderName} is now the room leader.`
                        );
                    }
                    break;

                case "game_aborted":
                    if (payload.reason === "reconnect_timeout") {
                        toast.warning(
                            "Game aborted: Players did not reconnect in time."
                        );
                    } else if (payload.reason === "not_enough_players") {
                        toast.warning("Game aborted: Not enough players.");
                    } else if (payload.reason === "leader_ended") {
                        toast.info("Game ended by the room leader.");
                    } else {
                        toast.info("Game was aborted.");
                    }
                    onGameAbortedRef.current?.(payload.reason);
                    break;

                case "user_disconnected":
                    toast.warning(
                        `${payload.userName || "A player"} disconnected.`
                    );
                    break;

                case "user_reconnected":
                    toast.success(
                        `${payload.userName || "A player"} reconnected.`
                    );
                    break;

                case "game_paused":
                    toast.warning(
                        "Game paused: Waiting for players to reconnect..."
                    );
                    break;

                case "game_resumed":
                    toast.success("Game resumed!");
                    break;

                case "player_moved_to_spectators":
                    if (payload.userId === userId) {
                        toast.info("You are now spectating the game.");
                    } else {
                        toast.info(`${payload.userName} is now spectating.`);
                    }
                    break;

                case "player_slot_claimed":
                    if (payload.claimingUserId === userId) {
                        toast.success("You have joined the game!");
                    } else {
                        toast.info(
                            `${payload.claimingUserName} has joined the game.`
                        );
                    }
                    break;
            }
        },
        [
            userId,
            roomCode,
            router,
            clearRoomSession,
            autoNavigateOnGameStart,
            isSpectator,
        ]
    );

    const handleError = useCallback(
        (error: { error: string }) => {
            const errorMessage = error.error || "An error occurred";

            // Handle specific errors
            if (
                errorMessage.includes("Room not found") ||
                errorMessage.includes("not in room")
            ) {
                toast.error("Room not found or session expired.");
                clearRoomSession();
                router.push("/");
                return;
            }

            toast.error(errorMessage);
        },
        [clearRoomSession, router]
    );

    useEffect(() => {
        if (!roomId || !userId) {
            return;
        }

        const socket = getSocket();

        // Set up event listeners
        socket.on("room_event", handleRoomEvent);
        socket.on("error", handleError);

        // Handle duplicate join acknowledgment (server-side deduplication)
        function handleAlreadyJoined() {
            console.log(
                "🔗 Already joined - duplicate connection detected by server"
            );
            hasJoinedRef.current = true;
        }
        socket.on("already_joined", handleAlreadyJoined);

        // Emit join_room only once per mount
        // This prevents duplicate syncs from React Strict Mode or re-renders
        if (!hasJoinedRef.current) {
            if (socket.connected) {
                console.log("🔗 Emitting join_room (already connected)");
                emitJoinRoom(roomId, userId);
                hasJoinedRef.current = true;
            } else {
                // If not connected yet, wait for connect event
                const onConnect = () => {
                    if (!hasJoinedRef.current) {
                        console.log("🔗 Emitting join_room (on connect)");
                        emitJoinRoom(roomId, userId);
                        hasJoinedRef.current = true;
                    }
                    socket.off("connect", onConnect);
                };
                socket.on("connect", onConnect);
            }
        }

        return () => {
            socket.off("room_event", handleRoomEvent);
            socket.off("error", handleError);
            socket.off("already_joined", handleAlreadyJoined);
        };
    }, [roomId, userId, handleRoomEvent, handleError]);

    return {
        emitJoinRoom: () => {
            if (roomId && userId) {
                emitJoinRoom(roomId, userId);
            }
        },
    };
}
