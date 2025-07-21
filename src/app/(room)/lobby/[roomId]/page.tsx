"use client";
import { useEffect, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function LobbyPage() {
    const { socket, connected } = useWebSocket();
    const [lobbyData, setLobbyData] = useState<any>(null);
    const roomId =
        typeof window !== "undefined" ? sessionStorage.getItem("roomId") : null;
    const userId =
        typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;

    useEffect(() => {
        if (!socket) return;
        function handleLobbyData(data: any) {
            setLobbyData(data);
        }
        socket.on("lobby-data", handleLobbyData);
        // Optionally request lobby data on mount
        socket.emit("get-lobby-data");
        return () => {
            socket.off("lobby-data", handleLobbyData);
        };
    }, [socket]);

    return (
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
    );
}
