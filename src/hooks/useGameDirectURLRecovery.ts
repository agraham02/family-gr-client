/**
 * Hook to handle rejoin/recovery when navigating directly to a game URL.
 * If no session exists, attempts to rejoin with a name prompt.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { useRouter, useParams } from "next/navigation";
import { attemptDirectGameRejoin } from "@/services/lobby";
import { toast } from "sonner";

interface UseGameDirectURLRecoveryOptions {
    onSessionRestored?: () => void;
    onRecoveryFailed?: () => void;
}

export function useGameDirectURLRecovery(
    options?: UseGameDirectURLRecoveryOptions
) {
    const { roomId, userId, userName, setSessionData } = useSession();
    const router = useRouter();
    const { roomCode } = useParams<{ roomCode: string }>();
    const [isRecovering, setIsRecovering] = useState(false);

    useEffect(() => {
        // Only trigger if:
        // 1. No session roomId (lost session), OR
        // 2. Valid roomCode from URL that differs from current session
        // This handles both: session loss AND navigating to different room
        if (!roomCode) {
            return;
        }

        // If we have a roomId, we need to check if URL matches current room
        // For now, we'll trigger recovery if there's no roomId
        // TODO: Add room code lookup to validate if roomId matches roomCode
        if (roomId) {
            return;
        }

        const recover = async () => {
            setIsRecovering(true);

            // Prompt for name if not in session
            let nameToUse: string = userName || "";
            if (!nameToUse) {
                const promptResult: string | null = prompt(
                    "Enter your name to rejoin the game:"
                );
                if (!promptResult) {
                    // User cancelled, redirect to lobby
                    router.push(`/lobby/${roomCode}`);
                    options?.onRecoveryFailed?.();
                    setIsRecovering(false);
                    return;
                }
                nameToUse = promptResult;
            }

            try {
                // Attempt to rejoin with existing userId (if available)
                const result = await attemptDirectGameRejoin(
                    roomCode,
                    nameToUse,
                    userId
                );

                if (result) {
                    // Successfully rejoined, update session
                    setSessionData({
                        roomId: result.roomId,
                        userId: result.userId,
                        userName: nameToUse,
                    });
                    toast.success(
                        "Rejoined! Connecting to game... You may need to wait for other players."
                    );
                    options?.onSessionRestored?.();
                } else {
                    // Rejoin failed, redirect to lobby
                    toast.error(
                        "Could not rejoin game. It may be in progress. Going to lobby..."
                    );
                    router.push(`/lobby/${roomCode}`);
                    options?.onRecoveryFailed?.();
                }
            } catch (error) {
                console.error("Error during game rejoin recovery:", error);
                toast.error("Failed to rejoin game. Redirecting to lobby...");
                router.push(`/lobby/${roomCode}`);
                options?.onRecoveryFailed?.();
            } finally {
                setIsRecovering(false);
            }
        };

        recover();
    }, [roomId, roomCode, userName, userId, router, setSessionData, options]);

    return { isRecovering };
}
