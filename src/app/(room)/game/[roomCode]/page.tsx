"use client";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import React, { useEffect } from "react";

type GameData = {
    // Define the structure of your game data here
    spadesBroken: false;
};

type BaseGameEvent = {
    event: string;
    gameState: GameData;
};

type RoomEventPayload = BaseGameEvent & { event: "sync" };

export default function GamePage() {
    const { roomId, userId } = useSession();
    const { socket, connected } = useWebSocket();
    // const { roomCode } = useParams();
    const [gameData, setGameData] = React.useState<object | null>(null);
    // const [hasJoined, setHasJoined] = useState(false);

    // const getGameState = useCallback(async () => {}, []);

    // useEffect(() => {
    //     if (!roomCode || hasJoined) return;
    //     getGameState();
    // }, [roomCode, hasJoined, getGameState]);

    useEffect(() => {
        if (!socket || !connected || !roomId || !userId) return;

        function handleGameEvent(payload: RoomEventPayload) {
            console.log("📨 Game event:", payload);
            setGameData(payload.gameState);
            switch (payload.event) {
                case "sync":
                    break;
            }
        }

        socket.on("game_event", handleGameEvent);

        socket.emit("join_game", { roomId, userId });

        return () => {
            socket.off("game_event", handleGameEvent);
        };
    }, [socket, connected, roomId, userId]);

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-50 dark:bg-zinc-950">
            <h1 className="text-3xl font-bold mb-6 dark:text-white">
                Game Data
            </h1>
            <div className="w-full max-w-xl">
                <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded text-sm overflow-x-auto min-h-[80px]">
                    {gameData
                        ? JSON.stringify(gameData, null, 2)
                        : "(No game data)"}
                </pre>
            </div>
        </main>
    );
}
