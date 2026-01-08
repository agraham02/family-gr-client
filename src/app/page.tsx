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
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { useSession } from "@/contexts/SessionContext";
import {
    PlusCircleIcon,
    UsersIcon,
    SparklesIcon,
    DicesIcon,
    ArrowRightIcon,
    Loader2Icon,
    AlertCircleIcon,
} from "lucide-react";
import {
    validatePlayerName,
    validateRoomName,
    validateRoomCode,
    sanitizePlayerName,
    sanitizeRoomName,
    sanitizeRoomCode,
} from "@/lib/validation";

interface CreateRoomCardProps {
    name: string;
    setName: (v: string) => void;
    roomName: string;
    setRoomName: (v: string) => void;
    onCreate: (name: string, roomName: string) => Promise<void>;
    loading: boolean;
    nameError: string | null;
    roomNameError: string | null;
}

function CreateRoomCard({
    name,
    setName,
    roomName,
    setRoomName,
    onCreate,
    loading,
    nameError,
    roomNameError,
}: CreateRoomCardProps) {
    const isFormValid = !nameError && name.trim().length > 0 && !roomNameError;
    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full"
        >
            <Card className="w-full backdrop-blur-sm bg-white/90 dark:bg-zinc-900/90 border-zinc-200/50 dark:border-zinc-700/50 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <PlusCircleIcon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                        Create a Room
                    </CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400">
                        Start a new game session
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="create-name"
                            className="text-sm font-medium"
                        >
                            Your Name
                        </Label>
                        <Input
                            id="create-name"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                                nameError
                                    ? "border-red-500 dark:border-red-400 focus:ring-red-500/20 focus:border-red-500"
                                    : ""
                            }`}
                            aria-label="Your Name"
                            maxLength={50}
                        />
                        {nameError && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                                <span>{nameError}</span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="room-name"
                            className="text-sm font-medium"
                        >
                            Room Name{" "}
                            <span className="text-zinc-400 font-normal">
                                (optional)
                            </span>
                        </Label>
                        <Input
                            id="room-name"
                            placeholder="My Game Room"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className={`h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                                roomNameError
                                    ? "border-red-500 dark:border-red-400 focus:ring-red-500/20 focus:border-red-500"
                                    : ""
                            }`}
                            aria-label="Room Name"
                            maxLength={100}
                        />
                        {roomNameError && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                                <span>{roomNameError}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="pt-2">
                    <Button
                        className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
                        type="button"
                        disabled={!isFormValid || loading}
                        onClick={() =>
                            onCreate(
                                sanitizePlayerName(name),
                                sanitizeRoomName(roomName)
                            )
                        }
                    >
                        {loading ? (
                            <>
                                <Loader2Icon className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                Create Room
                                <ArrowRightIcon className="w-4 h-4" />
                            </>
                        )}
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
    nameError: string | null;
    roomCodeError: string | null;
}

function JoinRoomCard({
    name,
    setName,
    roomCode,
    setRoomCode,
    onJoin,
    loading,
    nameError,
    roomCodeError,
}: JoinRoomCardProps) {
    const isFormValid =
        !nameError &&
        name.trim().length > 0 &&
        !roomCodeError &&
        roomCode.length === 6;
    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="w-full"
        >
            <Card className="w-full backdrop-blur-sm bg-white/90 dark:bg-zinc-900/90 border-zinc-200/50 dark:border-zinc-700/50 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <UsersIcon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                        Join a Room
                    </CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400">
                        Enter an existing game
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="join-name"
                            className="text-sm font-medium"
                        >
                            Your Name
                        </Label>
                        <Input
                            id="join-name"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${
                                nameError
                                    ? "border-red-500 dark:border-red-400 focus:ring-red-500/20 focus:border-red-500"
                                    : ""
                            }`}
                            aria-label="Your Name"
                            maxLength={50}
                        />
                        {nameError && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                                <span>{nameError}</span>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="room-code"
                            className="text-sm font-medium"
                        >
                            Room Code
                        </Label>
                        <Input
                            id="room-code"
                            placeholder="ABC123"
                            value={roomCode}
                            onChange={(e) =>
                                setRoomCode(e.target.value.toUpperCase())
                            }
                            className={`h-11 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 uppercase tracking-widest font-mono ${
                                roomCodeError
                                    ? "border-red-500 dark:border-red-400 focus:ring-red-500/20 focus:border-red-500"
                                    : ""
                            }`}
                            aria-label="Room Code"
                            maxLength={6}
                        />
                        {roomCodeError && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                                <span>{roomCodeError}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="pt-2">
                    <Button
                        className="w-full h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
                        type="button"
                        disabled={!isFormValid || loading}
                        onClick={() =>
                            onJoin(
                                sanitizePlayerName(name),
                                sanitizeRoomCode(roomCode)
                            )
                        }
                    >
                        {loading ? (
                            <>
                                <Loader2Icon className="w-4 h-4 animate-spin" />
                                Joining...
                            </>
                        ) : (
                            <>
                                Join Room
                                <ArrowRightIcon className="w-4 h-4" />
                            </>
                        )}
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
    const [nameError, setNameError] = useState<string | null>(null);
    const [roomNameError, setRoomNameError] = useState<string | null>(null);
    const [roomCodeError, setRoomCodeError] = useState<string | null>(null);
    const router = useRouter();
    const { setSessionData } = useSession();

    const handleSuccess = (
        res: { userId: string; roomId: string; roomCode: string },
        userName: string
    ) => {
        // Batch all state updates to prevent multiple WebSocket reconnections
        setSessionData({
            userName,
            userId: res.userId,
            roomId: res.roomId,
        });
        // Navigate after state is set
        router.push(`/lobby/${res.roomCode}`);
    };

    async function handleCreateRoom(name: string, roomName: string) {
        // Validate inputs
        const nameValidationError = validatePlayerName(name);
        const roomNameValidationError = validateRoomName(roomName);

        setNameError(nameValidationError?.message || null);
        setRoomNameError(roomNameValidationError?.message || null);

        if (nameValidationError || roomNameValidationError) {
            return;
        }

        setLoadingCreate(true);
        await toast.promise(createRoom(name, roomName), {
            loading: "Creating room...",
            success: (res) => {
                handleSuccess(res, name);
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
        // Validate inputs
        const nameValidationError = validatePlayerName(name);
        const roomCodeValidationError = validateRoomCode(roomCode);

        setNameError(nameValidationError?.message || null);
        setRoomCodeError(roomCodeValidationError?.message || null);

        if (nameValidationError || roomCodeValidationError) {
            return;
        }

        setLoadingJoin(true);
        // Pass existing userId from localStorage to maintain identity (important for kick enforcement)
        const existingUserId = localStorage.getItem("userId") || undefined;
        await toast.promise(joinRoom(name, roomCode, existingUserId), {
            loading: "Joining room...",
            success: (res) => {
                handleSuccess(res, name);
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
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 transition-colors">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient orbs */}
                <motion.div
                    className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-teal-500/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, 30, 0],
                        y: [0, -20, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-violet-400/30 to-purple-500/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, -30, 0],
                        y: [0, 20, 0],
                        scale: [1, 1.15, 1],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-400/10 via-pink-400/10 to-violet-400/10 rounded-full blur-3xl"
                    animate={{
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 60,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center px-4 py-12 md:py-16">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10 md:mb-14"
                >
                    {/* Logo/Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            duration: 0.6,
                            type: "spring",
                            bounce: 0.5,
                        }}
                        className="mx-auto mb-6 w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-orange-500/30"
                    >
                        <DicesIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                    </motion.div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 dark:from-white dark:via-zinc-200 dark:to-white bg-clip-text text-transparent tracking-tight">
                        Family Game Room
                    </h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mt-4 text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-md mx-auto"
                    >
                        Your hub for family fun and games.
                        <br className="hidden sm:block" />
                        <span className="inline-flex items-center gap-1.5 mt-1">
                            <SparklesIcon className="w-4 h-4 text-amber-500" />
                            Create or join a room to get started
                        </span>
                    </motion.p>
                </motion.div>

                {/* Divider with "or" */}
                <div className="hidden md:flex items-center gap-8 w-full max-w-3xl mb-0">
                    <Separator className="flex-1 bg-zinc-300 dark:bg-zinc-700" />
                </div>

                {/* Cards Container */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-3xl px-2">
                    <div className="flex-1 min-w-0">
                        <CreateRoomCard
                            name={name}
                            setName={setName}
                            roomName={roomName}
                            setRoomName={setRoomName}
                            onCreate={handleCreateRoom}
                            loading={loadingCreate}
                            nameError={nameError}
                            roomNameError={roomNameError}
                        />
                    </div>

                    {/* Mobile divider */}
                    <div className="flex md:hidden items-center gap-4">
                        <Separator className="flex-1 bg-zinc-300 dark:bg-zinc-700" />
                        <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
                            or
                        </span>
                        <Separator className="flex-1 bg-zinc-300 dark:bg-zinc-700" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <JoinRoomCard
                            name={name}
                            setName={setName}
                            roomCode={roomCode}
                            setRoomCode={setRoomCode}
                            onJoin={handleJoinRoom}
                            loading={loadingJoin}
                            nameError={nameError}
                            roomCodeError={roomCodeError}
                        />
                    </div>
                </div>

                {/* Footer note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mt-10 text-sm text-zinc-400 dark:text-zinc-500 text-center"
                >
                    Play Spades, Dominoes, and more with friends and family
                </motion.p>
            </div>
        </main>
    );
}
