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
import { LobbyData, RoomEventPayload } from "@/types";
import LobbyDashboard from "@/components/lobby/LobbyDashboard";
import { ClipboardIcon } from "lucide-react";

export default function LobbyPage() {
    const { socket, connected } = useWebSocket();
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
    const [hasJoined, setHasJoined] = useState(false);
    const router = useRouter();

    const handleReconnect = useCallback(async () => {
        if (!userName || !roomCode) return;
        try {
            const res = await joinRoom(userName, roomCode, userId);
            // console.log("Reconnected with response:", res);
            if (res.roomId !== roomId) {
                setRoomId(res.roomId);
            }
            if (res.userId !== userId) {
                setUserId(res.userId);
            }
            setHasJoined(true);
        } catch (error) {
            toast.error(
                "Failed to join room: " +
                    (error instanceof Error ? error.message : "Unknown error")
            );
            router.push("/");
        }
    }, [userName, roomCode, userId, roomId, setUserId, setRoomId]);

    useEffect(() => {
        if (!initializing) setShowModal(!userName);
    }, [userName, initializing]);

    useEffect(() => {
        if (!userName || !roomCode || hasJoined) return;
        handleReconnect();
    }, [userName, roomCode, hasJoined, handleReconnect]);

    useEffect(() => {
        if (!socket || !connected || !roomId || !userId) return;

        function handleRoomEvent(payload: RoomEventPayload) {
            console.log("📨 Room event:", payload);
            setLobbyData(payload.roomState);
            switch (payload.event) {
                case "game_started":
                    toast.info(`Starting ${payload.gameType} game...`);
                    router.push(`/game/${roomCode}`);
                    break;
                case "user_joined":
                case "user_left":
                    toast.info(
                        `${payload.userName} ${
                            payload.event === "user_joined" ? "joined" : "left"
                        }`
                    );
                    break;
                case "room_closed":
                    toast.warning("Room has been closed by the leader");
                    router.push("/");
                    break;
            }
        }

        socket.on("room_event", handleRoomEvent);

        socket.emit("join_room", { roomId, userId });

        return () => {
            socket.off("room_event", handleRoomEvent);
        };
    }, [socket, connected, roomId, userId, roomCode, router]);

    function handleNameSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (pendingName.trim()) {
            setUserName(pendingName.trim());
            setShowModal(false);
        }
    }

    if (!hasJoined) {
        return (
            <>
                <div className="flex items-center justify-center h-screen">
                    <p className="text-lg">Joining room...</p>
                </div>
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
        <>
            <main className="px-4 py-8 flex flex-col items-center">
                <header className="text-center">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {lobbyData?.name}
                        </h1>
                    </div>
                    <div className="flex items-center justify-center">
                        {/* <h2 className="text-xl font-semibold">Lobby Details</h2> */}
                        <p className="text-xl">Room Code: {lobbyData?.code}</p>
                        <div className="mx-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        lobbyData?.code ?? ""
                                    );
                                    toast.success(
                                        "Room code copied to clipboard"
                                    );
                                }}
                            >
                                {/* copy icon */}
                                <ClipboardIcon className="w-2 h-2" />
                            </Button>
                        </div>
                    </div>
                </header>

                {lobbyData && <LobbyDashboard lobbyData={lobbyData} />}
            </main>
        </>
    );
}
