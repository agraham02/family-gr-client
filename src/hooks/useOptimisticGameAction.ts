import { useCallback, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { GameData, PlayerData } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Optimistic action tracking
 */
type PendingAction = {
    id: string;
    type: string;
    payload: unknown;
    timestamp: number;
    snapshot: {
        gameData: GameData;
        playerData: PlayerData;
    };
};

type OptimisticUpdateResult = {
    gameData?: Partial<GameData>;
    playerData?: Partial<PlayerData>;
};

type OptimisticReducer = (
    gameData: GameData,
    playerData: PlayerData,
    action: { type: string; payload: unknown; userId: string }
) => OptimisticUpdateResult | null;

type UseOptimisticGameActionProps = {
    socket: Socket | null;
    connected: boolean;
    roomId: string;
    userId: string;
    gameData: GameData | null;
    playerData: PlayerData | null;
    setGameData: (data: GameData | null) => void;
    setPlayerData: (data: PlayerData | null) => void;
    optimisticReducer: OptimisticReducer;
    onRollback?: (reason: string) => void;
    actionTimeout?: number; // ms before considering action failed (default: 5000)
};

export function useOptimisticGameAction({
    socket,
    connected,
    roomId,
    userId,
    gameData,
    playerData,
    setGameData,
    setPlayerData,
    optimisticReducer,
    onRollback,
    actionTimeout = 5000,
}: UseOptimisticGameActionProps) {
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(
        null
    );
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Rollback to the saved snapshot
     */
    const rollback = useCallback(
        (reason: string) => {
            if (!pendingAction) return;

            console.warn(
                `[OptimisticAction] Rolling back action "${pendingAction.type}": ${reason}`
            );

            // Restore snapshot
            setGameData(pendingAction.snapshot.gameData);
            setPlayerData(pendingAction.snapshot.playerData);

            // Clear pending action
            setPendingAction(null);

            // Clear timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            // Notify caller
            onRollback?.(reason);
        },
        [pendingAction, setGameData, setPlayerData, onRollback]
    );

    /**
     * Confirm the pending action (server acknowledged it)
     */
    const confirm = useCallback(() => {
        if (!pendingAction) return;

        console.log(
            `[OptimisticAction] Action "${pendingAction.type}" confirmed by server`
        );

        setPendingAction(null);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [pendingAction]);

    /**
     * Dispatch an action with optimistic update
     */
    const dispatch = useCallback(
        (actionType: string, actionPayload: unknown) => {
            if (!socket || !connected || !gameData || !playerData) {
                console.warn(
                    "[OptimisticAction] Cannot dispatch: socket not connected or missing game data"
                );
                return;
            }

            // Block if there's already a pending action
            if (pendingAction) {
                console.warn(
                    "[OptimisticAction] Action blocked: another action is pending"
                );
                return;
            }

            // Generate unique action ID
            const actionId = `${userId}-${uuidv4()}`;

            // Save snapshot
            const snapshot = {
                gameData: { ...gameData },
                playerData: { ...playerData },
            };

            // Apply optimistic update
            const action = { type: actionType, payload: actionPayload, userId };
            const optimisticUpdate = optimisticReducer(
                gameData,
                playerData,
                action
            );

            if (optimisticUpdate) {
                if (optimisticUpdate.gameData) {
                    setGameData({
                        ...gameData,
                        ...optimisticUpdate.gameData,
                    } as GameData);
                }
                if (optimisticUpdate.playerData) {
                    setPlayerData({
                        ...playerData,
                        ...optimisticUpdate.playerData,
                    } as PlayerData);
                }
            }

            // Track pending action
            const pending: PendingAction = {
                id: actionId,
                type: actionType,
                payload: actionPayload,
                timestamp: Date.now(),
                snapshot,
            };
            setPendingAction(pending);

            // Set timeout for rollback
            timeoutRef.current = setTimeout(() => {
                rollback("Action timed out");
            }, actionTimeout);

            // Emit action to server
            socket.emit("game_action", {
                roomId,
                action: { ...action, actionId },
            });

            console.log(
                `[OptimisticAction] Dispatched "${actionType}" optimistically with ID: ${actionId}`
            );
        },
        [
            socket,
            connected,
            gameData,
            playerData,
            userId,
            roomId,
            pendingAction,
            optimisticReducer,
            setGameData,
            setPlayerData,
            rollback,
            actionTimeout,
        ]
    );

    return {
        dispatch,
        rollback,
        confirm,
        hasPendingAction: !!pendingAction,
        pendingActionType: pendingAction?.type ?? null,
    };
}
