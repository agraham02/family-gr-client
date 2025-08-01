import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { User } from "@/types";
import { useSession } from "@/contexts/SessionContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { toast } from "sonner";

export default function PlayerListCard({
    users,
    leaderId,
    readyStates,
    isPartyLeader,
}: {
    users: User[];
    leaderId: string;
    readyStates: Record<string, boolean>;
    isPartyLeader: boolean;
}) {
    const { socket, connected } = useWebSocket();
    const { userId, roomId } = useSession();
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
        toast(
            `Promoted ${
                users.find((u) => u.id === newLeaderId)?.name
            } to leader`
        );
    }

    return (
        <Card className="bg-white dark:bg-zinc-900 shadow-md">
            <CardHeader>
                <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
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
                                className={`flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg min-w-0 transition-colors gap-2 md:gap-4 ${
                                    user.id === userId
                                        ? "bg-zinc-200 dark:bg-zinc-800"
                                        : ""
                                }`}
                            >
                                <div className="flex flex-wrap items-center gap-2 min-w-0">
                                    <span className="font-medium truncate max-w-[8rem] md:max-w-[12rem]">
                                        {user.name}
                                        {user.id === userId && " (You)"}
                                    </span>
                                    {user.id === leaderId && (
                                        <span className="px-2 py-0.5 text-xs rounded bg-blue-500 text-white dark:bg-blue-600 whitespace-nowrap">
                                            Leader
                                        </span>
                                    )}
                                    <span
                                        className={`px-2 py-0.5 text-xs rounded whitespace-nowrap ${
                                            ready
                                                ? "bg-green-500 text-white dark:bg-green-600"
                                                : "bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                                        }`}
                                    >
                                        {ready ? "Ready" : "Unready"}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
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
