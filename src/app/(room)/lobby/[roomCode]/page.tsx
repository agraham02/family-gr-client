"use client";

import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useParams, useRouter } from "next/navigation";
import { GameType, getAvailableGames, joinRoom } from "@/services/lobby";
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
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";

type LobbyData = {
    code: string;
    name: string;
    createdAt: string;
    state: string;
    readyStates: Record<string, boolean>;
    roomId: string;
    users: Array<{
        id: string;
        name: string;
    }>;
    leaderId: string;
    selectedGameType: string;
    // Add other fields as needed
};

type BaseRoomEvent = {
    event: string;
    roomState: LobbyData;
    timestamp: string;
};

type RoomEventPayload =
    | (BaseRoomEvent & { event: "sync" })
    | (BaseRoomEvent & { event: "user_joined"; userName: string })
    | (BaseRoomEvent & { event: "user_left"; userName: string })
    | (BaseRoomEvent & {
          event: "game_started";
          gameId: string;
          gameState: object;
      });

function LobbyDashboard({ lobbyData }: { lobbyData: LobbyData }) {
    const { socket, connected } = useWebSocket();

    console.log(lobbyData);
    // Dummy data for games; replace with backend/game context later
    const [availableGames, setAvailableGames] = useState<GameType[]>([]);
    // You can lift these states up if needed for socket/game selection
    const [selectedGame, setSelectedGame] = useState<string | null>(
        lobbyData.selectedGameType
    );

    // Get session context
    const { userId, userName, roomId } = useSession();
    // For demo, fallback to dummy users if not provided
    const users = lobbyData.users;
    const leaderId = lobbyData.leaderId;
    const readyStates = lobbyData.readyStates;
    const isPartyLeader = userId === leaderId;

    // Ready state for current user
    const [isReady, setIsReady] = useState(!!readyStates[userId]);

    useEffect(() => {
        const fetchAvailableGames = async () => {
            try {
                const { games } = await getAvailableGames();
                console.log(games);
                setAvailableGames(games);
            } catch (error) {
                toast.error("Failed to load available games");
            }
        };
        fetchAvailableGames();
    }, []);

    useEffect(() => {
        setSelectedGame(lobbyData.selectedGameType);
    }, [lobbyData.selectedGameType]);

    function handleToggleReady() {
        if (!socket || !connected) {
            toast.error("Not connected to the server");
            return;
        }

        socket.emit("toggle_ready", { roomId, userId });
        setIsReady((prev) => !prev);
    }

    // Actions (kick/promote) would call socket events in real app
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
    function handleSelectGame(gameType: string) {
        if (!socket || !connected) {
            toast.error("Not connected to the server");
            return;
        }

        socket.emit("select_game", { roomId, userId, gameType });
    }

    function handleCloseRoom() {
        // TODO: socket.emit("close_room", { roomId })
        toast("Room closed");
    }

    function handleStartGame() {
        if (!socket || !connected) {
            toast.error("Not connected to the server");
            return;
        }
        socket.emit("start_game", { roomId, userId, gameType: selectedGame });
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto mt-8">
            {/* Users Card */}
            <Card className="bg-white dark:bg-zinc-900 shadow-md">
                <CardHeader>
                    <CardTitle>Players</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    {users.map((user) => {
                        const ready = readyStates[user.id];
                        return (
                            <div
                                key={user.id}
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
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Games Card */}
            <Card className="bg-white dark:bg-zinc-900 shadow-md">
                <CardHeader>
                    <CardTitle>Available Games</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    {availableGames.map((game) => (
                        <Button
                            key={game.type}
                            variant={
                                selectedGame === game.type
                                    ? "default"
                                    : "outline"
                            }
                            className={`w-full justify-start ${
                                selectedGame === game.type
                                    ? "bg-blue-500 text-white dark:bg-blue-600"
                                    : ""
                            }`}
                            onClick={
                                isPartyLeader
                                    ? () => handleSelectGame(game.type)
                                    : undefined
                            }
                            disabled={!isPartyLeader}
                            aria-disabled={!isPartyLeader}
                        >
                            {game.type}
                            {selectedGame === game.type && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-700 text-white dark:bg-blue-800">
                                    Selected
                                </span>
                            )}
                            {!isPartyLeader && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                    Only leader can change
                                </span>
                            )}
                        </Button>
                    ))}
                </CardContent>
            </Card>

            {/* Room Controls Card */}
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
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Room ID: <span className="font-mono">{roomId}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

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

            {/* <main className="flex flex-col items-center justify-center min-h-screen p-8">
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
            </main> */}
            {lobbyData && <LobbyDashboard lobbyData={lobbyData} />}
        </>
    );
}
