import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { LobbyData } from "@/types";
import { useSession } from "@/contexts/SessionContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { toast } from "sonner";

export default function PlayerListCard({
    lobbyData,
}: {
    lobbyData: LobbyData;
}) {
    const { socket, connected } = useWebSocket();
    const { userId, roomId } = useSession();
    const users = lobbyData.users;
    const leaderId = lobbyData.leaderId;
    const readyStates = lobbyData.readyStates;
    const isPartyLeader = userId === leaderId;
    const [isReady, setIsReady] = useState(!!readyStates[userId]);

    function handleToggleReady() {
        if (!socket || !connected) {
            toast.error("Not connected to the server");
            return;
        }

        socket.emit("toggle_ready", { roomId, userId });
        setIsReady((prev) => !prev);
    }

    function handleKick(userId: string) {
        // TODO: socket.emit("kick_user", { userId })
        toast(`Kicked user ${userId}`);
    }

    function handlePromote(newLeaderId: string) {
        if (!socket || !connected) {
            toast.error("Not connected to the server");
            return;
        }
        socket.emit("promote_leader", { roomId, userId, newLeaderId });
        toast(`Promoted user ${userId} to leader`);
    }

    return (
        <Card className="bg-white dark:bg-zinc-900 shadow-md">
            <CardHeader>
                <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                    {users.map((user) => {
                        const ready = readyStates[user.id];
                        return (
                            <motion.div
                                key={user.id}
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -50, opacity: 0 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className={`flex items-center justify-between p-2 rounded transition-colors ${
                                    user.id === userId
                                        ? "bg-zinc-200 dark:bg-zinc-800"
                                        : ""
                                }`}
                            >
                                <span className="font-medium flex items-center gap-2">
                                    {user.name}
                                    {user.id === userId && " (You)"}
                                    {user.id === leaderId && (
                                        <span className="px-2 py-0.5 text-xs rounded bg-blue-500 text-white dark:bg-blue-600">
                                            Leader
                                        </span>
                                    )}
                                    <span
                                        className={`px-2 py-0.5 text-xs rounded ${
                                            ready
                                                ? "bg-green-500 text-white dark:bg-green-600"
                                                : "bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                        }`}
                                    >
                                        {ready ? "Ready" : "Unready"}
                                    </span>
                                </span>
                                <div className="flex gap-2">
                                    {user.id === userId && (
                                        <Button
                                            size="sm"
                                            variant={
                                                isReady ? "outline" : "default"
                                            }
                                            className={
                                                isReady
                                                    ? "border-green-500 text-green-600 dark:border-green-600"
                                                    : "bg-green-500 text-white dark:bg-green-600"
                                            }
                                            onClick={handleToggleReady}
                                        >
                                            {isReady ? "Unready" : "Ready"}
                                        </Button>
                                    )}
                                    {user.id !== userId && isPartyLeader && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 border-red-300 dark:border-red-600"
                                                onClick={() =>
                                                    handleKick(user.id)
                                                }
                                            >
                                                Kick
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-blue-600 border-blue-300 dark:border-blue-600"
                                                onClick={() =>
                                                    handlePromote(user.id)
                                                }
                                            >
                                                Promote
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
