"use client";

import { useEffect, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useParams } from "next/navigation";
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

export default function LobbyPage() {
    const { socket, connected } = useWebSocket();
    const [lobbyData, setLobbyData] = useState<any>(null);
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

    async function handleReconnect() {
        if (!userName || !roomCode) return;
        const res = await joinRoom(userName, roomCode, userId);
        console.log("Reconnected with response:", res);
        if (!roomId || !userId) {
            console.log("Overwriting session storage with new values");
            setUserId(res.userId);
            setRoomId(res.roomId);
        }
        setHasJoined(true);
    }

    useEffect(() => {
        if (!initializing) setShowModal(!userName);
    }, [userName, initializing]);

    useEffect(() => {
        if (!userName || !roomCode || hasJoined) return;
        handleReconnect();
    }, [userName, roomCode]);

    useEffect(() => {
        if (!socket || !connected || !roomId || !userId) return;

        function handleRoomEvent(payload: any) {
            console.log("📨 Room event:", payload);
            setLobbyData(payload.roomState);
            switch (payload.event) {
                case "sync":
                    // setLobbyData(payload.roomState);
                    break;
                case "user_joined":
                    toast(`${payload.userName} joined`);
                    break;
                case "user_left":
                    toast(`${payload.userName} left`);

                    break;
            }
        }

        socket.on("room_event", handleRoomEvent);

        socket.emit("join_room", { roomId, userId });

        return () => {
            socket.off("room_event", handleRoomEvent);
        };
    }, [socket, connected, roomId, userId]);

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
            <main className="flex flex-col items-center justify-center min-h-screen p-8">
                <h1 className="text-3xl font-bold mb-4">Lobby</h1>
                <div className="mb-2">
                    Connection:{" "}
                    {connected ? (
                        <span className="text-green-600">Connected</span>
                    ) : (
                        <span className="text-red-600">Disconnected</span>
                    )}
                </div>
                <div className="mb-2">
                    Room ID: <span className="font-mono">{roomId}</span>
                </div>
                <div className="mb-2">
                    User ID: <span className="font-mono">{userId}</span>
                </div>
                <div className="mb-2">
                    Room Code: <span className="font-mono">{roomCode}</span>
                </div>
                <div className="w-full max-w-xl mt-6">
                    <h2 className="text-xl font-semibold mb-2">
                        Lobby Data from Server:
                    </h2>
                    <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded text-sm overflow-x-auto min-h-[80px]">
                        {lobbyData
                            ? JSON.stringify(lobbyData, null, 2)
                            : "(No data received)"}
                    </pre>
                </div>
            </main>
        </>
    );
}
