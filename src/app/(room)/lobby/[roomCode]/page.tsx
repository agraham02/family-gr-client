"use client";

import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useParams, useRouter } from "next/navigation";
import { joinRoom } from "@/services/lobby";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";
import { LobbyData } from "@/types";
import LobbyDashboard from "@/components/lobby/LobbyDashboard";
import { LobbySkeleton } from "@/components/skeletons";
import { ClipboardIcon } from "lucide-react";
import { useRoomEvents } from "@/hooks/useRoomEvents";

export default function LobbyPage() {
    const { connected } = useWebSocket();
    const [lobbyData, setLobbyData] = useState<LobbyData | null>(null);
    const { roomCode }: { roomCode: string } = useParams();
    const {
        roomId,
        userId,
        userName,
        setRoomId,
        setUserId,
        setUserName,
        initializing,
    } = useSession();
    const [showModal, setShowModal] = useState(false);
    const [pendingName, setPendingName] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const router = useRouter();

    // Use the shared room events hook
    useRoomEvents({
        roomCode,
        onSync: (roomState) => {
            setLobbyData(roomState);
        },
        // Don't auto-navigate from lobby - let the hook handle game_started
        autoNavigateOnGameStart: true,
    });

    // Handle joining room via REST API when we have userName but no roomId
    const handleJoinRoom = useCallback(async () => {
        if (!userName || !roomCode || isJoining) return;

        setIsJoining(true);
        try {
            const res = await joinRoom(userName, roomCode, userId);
            if (res.roomId !== roomId) {
                setRoomId(res.roomId);
            }
            if (res.userId !== userId) {
                setUserId(res.userId);
            }
        } catch (error) {
            toast.error(
                "Failed to join room: " +
                    (error instanceof Error ? error.message : "Unknown error")
            );
            router.push("/");
        } finally {
            setIsJoining(false);
        }
    }, [
        userName,
        roomCode,
        userId,
        roomId,
        setUserId,
        setRoomId,
        router,
        isJoining,
    ]);

    // Show name modal if no userName
    useEffect(() => {
        if (!initializing && !userName) {
            setShowModal(true);
        }
    }, [userName, initializing]);

    // Join room when we have userName but no roomId
    useEffect(() => {
        if (!initializing && userName && !roomId && roomCode) {
            handleJoinRoom();
        }
    }, [initializing, userName, roomId, roomCode, handleJoinRoom]);

    function handleNameSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (pendingName.trim()) {
            setUserName(pendingName.trim());
            setShowModal(false);
        }
    }

    // Show skeleton while initializing, joining, or waiting for lobby data
    const isLoading = initializing || isJoining || !lobbyData;

    if (isLoading) {
        return (
            <>
                <LobbySkeleton />
                <Dialog open={showModal}>
                    <DialogContent>
                        <motion.form
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleNameSubmit}
                            className="flex flex-col gap-4 items-center p-6"
                        >
                            <DialogHeader>
                                <DialogTitle>
                                    Enter your name to join the lobby
                                </DialogTitle>
                            </DialogHeader>
                            <Input
                                autoFocus
                                placeholder="Your Name"
                                value={pendingName}
                                onChange={(e) => setPendingName(e.target.value)}
                                className="w-64"
                            />
                            <Button type="submit" className="w-full mt-2">
                                Join
                            </Button>
                        </motion.form>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    return (
        <main className="px-4 py-8 flex flex-col items-center">
            <header className="text-center">
                <div>
                    <h1 className="text-3xl font-bold">
                        {lobbyData.name || "Lobby"}
                    </h1>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <p className="text-xl">Room Code: {lobbyData.code}</p>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                            navigator.clipboard.writeText(lobbyData.code);
                            toast.success("Room code copied to clipboard");
                        }}
                        title="Copy room code"
                    >
                        <ClipboardIcon className="w-4 h-4" />
                    </Button>
                    {!connected && (
                        <span className="text-sm text-yellow-500">
                            (Reconnecting...)
                        </span>
                    )}
                </div>
            </header>

            <LobbyDashboard lobbyData={lobbyData} />
        </main>
    );
}
