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
        const res = await joinRoom(userName, roomCode, userId);
        console.log("Reconnected with response:", res);
        if (res.roomId !== roomId) {
            console.log("Overwriting session storage with new roomId");
            setRoomId(res.roomId);
        }
        if (res.userId !== userId) {
            console.log("Overwriting session storage with new userId");
            setUserId(res.userId);
        }
        setHasJoined(true);
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
                case "sync":
                    // setLobbyData(payload.roomState);
                    break;
                case "game_started":
                    toast(`Started game ${payload.gameId}`);
                    router.push(`/game/${roomCode}`);
                    break;
                case "user_joined":
                case "user_left":
                    toast(
                        `${payload.userName} ${
                            payload.event === "user_joined" ? "joined" : "left"
                        }`
                    );
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

    return (
        <>
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
            <main>
                <header>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {lobbyData?.name}
                        </h1>
                    </div>
                    <div>
                        {/* <h2 className="text-xl font-semibold">Lobby Details</h2> */}
                        <p className="text-sm">Room Code: {lobbyData?.code}</p>
                    </div>
                </header>

                {lobbyData && <LobbyDashboard lobbyData={lobbyData} />}
            </main>
        </>
    );
}
