"use client";
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "./SessionContext";
import { toast } from "sonner";
import { SOCKET_BASE } from "@/services";

interface WebSocketContextValue {
    socket: Socket | null;
    connected: boolean;
    reconnecting: boolean;
    send: <T>(event: string, payload: T) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(
    undefined
);

export function useWebSocket() {
    const ctx = useContext(WebSocketContext);
    if (!ctx)
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    return ctx;
}

interface WebSocketProviderProps {
    children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const { roomId, userId } = useSession();

    useEffect(() => {
        if (!roomId || !userId) {
            return;
        }

        const socket = io(SOCKET_BASE, {
            query: { roomId, userId },
            transports: ["websocket", "polling"],
            autoConnect: true,
            timeout: 20000,
            forceNew: true, // Ensure fresh connection
            reconnection: true, // Enable automatic reconnection
            reconnectionAttempts: 10, // Max reconnection attempts
            reconnectionDelay: 1000, // Initial delay between reconnection attempts
            reconnectionDelayMax: 5000, // Max delay between attempts
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            setReconnecting(false);
            // Re-join the room on (re)connect to trigger rejoin logic on the server
            socket.emit("join_room", { roomId, userId });
        });

        socket.on("disconnect", (reason) => {
            setConnected(false);
            // Socket.io will handle reconnection with exponential backoff
            // for all disconnect reasons (transport close, ping timeout, server disconnect)
            // No manual socket.connect() needed - let the built-in reconnection handle it
            console.log(`Socket disconnected: ${reason}`);
        });

        socket.on("reconnecting", () => {
            setReconnecting(true);
        });

        socket.on("reconnect", () => {
            setReconnecting(false);
            toast.success("Reconnected to server!");
        });

        socket.on("reconnect_failed", () => {
            setReconnecting(false);
            toast.error("Failed to reconnect. Please refresh the page.");
        });

        socket.on("connect_error", (error) => {
            toast.error(
                "WebSocket connection error: " +
                    (error.message || "Unknown error")
            );
            setConnected(false);
        });

        socket.on("error", (error) => {
            toast.error(error.error || "WebSocket error occurred");
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setConnected(false);
            setReconnecting(false);
        };
    }, [roomId, userId]);

    const send = <T,>(event: string, payload: T) => {
        if (socketRef.current && connected) {
            socketRef.current.emit(event, payload);
        }
    };

    return (
        <WebSocketContext.Provider
            value={{ socket: socketRef.current, connected, reconnecting, send }}
        >
            {children}
        </WebSocketContext.Provider>
    );
}
