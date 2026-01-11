/**
 * Hook to handle rejoin/recovery when navigating directly to a game URL.
 * If no session exists, attempts to rejoin with a name prompt.
 * Validates that URL roomCode matches stored roomId to prevent navigation bugs.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { useRouter, useParams } from "next/navigation";
import { attemptDirectGameRejoin, getRoomIdByCode } from "@/services/lobby";
import { toast } from "sonner";

interface UseGameDirectURLRecoveryOptions {
    onSessionRestored?: () => void;
    onRecoveryFailed?: () => void;
}

export function useGameDirectURLRecovery(
    options?: UseGameDirectURLRecoveryOptions
) {
    const { roomId, userId, userName, setSessionData, clearRoomSession } =
        useSession();
    const router = useRouter();
    const { roomCode } = useParams<{ roomCode: string }>();
    const [isRecovering, setIsRecovering] = useState(false);
    const [hasValidated, setHasValidated] = useState(false);

    useEffect(() => {
        if (!roomCode || hasValidated) {
            return;
        }

        const validateAndRecover = async () => {
            // If we have a roomId, validate it matches the URL's roomCode
            if (roomId) {
                const actualRoomId = await getRoomIdByCode(roomCode);
                if (actualRoomId && actualRoomId !== roomId) {
                    console.log(
                        `Room mismatch detected: URL roomCode=${roomCode} → roomId=${actualRoomId}, ` +
                            `but session has roomId=${roomId}. Clearing session.`
                    );
                    clearRoomSession();
                    // Will trigger recovery on next effect run
                }
                setHasValidated(true);
                return;
            }

            // No roomId in session, trigger recovery
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
                setHasValidated(true);
            }
        };

        validateAndRecover();
    }, [
        roomCode,
        roomId,
        userId,
        userName,
        router,
        setSessionData,
        clearRoomSession,
        hasValidated,
        options,
    ]);

    return { isRecovering };
}
