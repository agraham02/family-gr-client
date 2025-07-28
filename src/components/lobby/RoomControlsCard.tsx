import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";

export default function RoomControlsCard({
    selectedGame,
    isPartyLeader,
}: {
    selectedGame: string | null;
    isPartyLeader: boolean;
}) {
    const { socket, connected } = useWebSocket();
    const { userId, roomId } = useSession();

    function handleCloseRoom() {
        if (!socket || !connected) {
            toast.error("Not connected to the server");
            return;
        }
        socket.emit("close_room", { roomId, userId });
        toast.warning("Room closed");
    }

    function handleStartGame() {
        if (!socket || !connected) {
            toast.error("Not connected to the server");
            return;
        }
        socket.emit("start_game", { roomId, userId, gameType: selectedGame });
    }

    return (
        <Card className="bg-white dark:bg-zinc-900 shadow-md">
            <CardHeader>
                <CardTitle>Room Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCloseRoom}
                >
                    Close Room
                </Button>
                {isPartyLeader && (
                    <Button className="w-full" onClick={handleStartGame}>
                        Start Game
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
