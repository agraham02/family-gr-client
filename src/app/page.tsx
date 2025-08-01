"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createRoom, joinRoom } from "@/services/lobby";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useSession } from "@/contexts/SessionContext";

interface CreateRoomCardProps {
    name: string;
    setName: (v: string) => void;
    roomName: string;
    setRoomName: (v: string) => void;
    onCreate: (name: string, roomName: string) => Promise<void>;
    loading: boolean;
}

function CreateRoomCard({
    name,
    setName,
    roomName,
    setRoomName,
    onCreate,
    loading,
}: CreateRoomCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="w-full max-w-sm dark:bg-zinc-900 bg-white shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle>Create a Room</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Input
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="dark:bg-zinc-800"
                        aria-label="Your Name"
                    />
                    <Input
                        placeholder="Room Name (optional)"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="dark:bg-zinc-800"
                        aria-label="Room Name"
                    />
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        type="button"
                        disabled={!name || loading}
                        onClick={() => onCreate(name, roomName)}
                    >
                        {loading ? "Creating..." : "Create Room"}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}

interface JoinRoomCardProps {
    name: string;
    setName: (v: string) => void;
    roomCode: string;
    setRoomCode: (v: string) => void;
    onJoin: (name: string, roomCode: string) => Promise<void>;
    loading: boolean;
}

function JoinRoomCard({
    name,
    setName,
    roomCode,
    setRoomCode,
    onJoin,
    loading,
}: JoinRoomCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
        >
            <Card className="w-full max-w-sm dark:bg-zinc-900 bg-white shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle>Join a Room</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Input
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="dark:bg-zinc-800"
                        aria-label="Your Name"
                    />
                    <Input
                        placeholder="Room Code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        className="dark:bg-zinc-800"
                        aria-label="Room Code"
                    />
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        type="button"
                        disabled={!name || !roomCode || loading}
                        onClick={() => onJoin(name, roomCode)}
                    >
                        {loading ? "Joining..." : "Join Room"}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}

export default function Home() {
    const [name, setName] = useState("");
    const [roomName, setRoomName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [loadingJoin, setLoadingJoin] = useState(false);
    const router = useRouter();
    const { setUserId, setRoomId, setUserName } = useSession();

    const handleSuccess = (
        res: { userId: string; roomId: string; roomCode: string },
    ) => {
        setUserId(res.userId);
        setRoomId(res.roomId);
        setUserName(name);
        router.push(`/lobby/${res.roomCode}`);
    };

    async function handleCreateRoom(name: string, roomName: string) {
        setLoadingCreate(true);
        await toast.promise(createRoom(name, roomName), {
            loading: "Creating room...",
            success: (res) => {
                handleSuccess(res);
                return "Room created successfully!";
            },
            error: (err) => {
                let message = "Unknown error";
                if (err instanceof Error) message = err.message;
                return `Error Creating Room: ${message}`;
            },
        });
        setLoadingCreate(false);
    }

    async function handleJoinRoom(name: string, roomCode: string) {
        setLoadingJoin(true);
        await toast.promise(joinRoom(name, roomCode), {
            loading: "Joining room...",
            success: (res) => {
                handleSuccess(res);
                return "Joined room successfully!";
            },
            error: (err) => {
                let message = "Unknown error";
                if (err instanceof Error) message = err.message;
                return `Error Joining Room: ${message}`;
            },
        });
        setLoadingJoin(false);
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 transition-colors">
            <h1 className="text-4xl font-bold text-center dark:text-white">
                Welcome to the Family Game Room!
            </h1>
            <p className="mt-4 text-lg text-center dark:text-zinc-300">
                Your hub for family fun and games.
            </p>
            <div className="flex flex-col md:flex-row my-5 w-full max-w-3xl items-center justify-center">
                <div className="m-5">
                    <CreateRoomCard
                        name={name}
                        setName={setName}
                        roomName={roomName}
                        setRoomName={setRoomName}
                        onCreate={handleCreateRoom}
                        loading={loadingCreate}
                    />
                </div>
                <div>
                    <JoinRoomCard
                        name={name}
                        setName={setName}
                        roomCode={roomCode}
                        setRoomCode={setRoomCode}
                        onJoin={handleJoinRoom}
                        loading={loadingJoin}
                    />
                </div>
            </div>
        </main>
    );
}
