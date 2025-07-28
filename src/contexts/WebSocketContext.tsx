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

interface WebSocketContextValue {
    socket: Socket | null;
    connected: boolean;
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
    const socketRef = useRef<Socket | null>(null);
    const { roomId, userId } = useSession();

    useEffect(() => {
        if (!roomId || !userId) {
            return;
        }

        const url =
            process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
        const socket = io(url, {
            query: { roomId, userId },
            transports: ["websocket", "polling"],
            autoConnect: true,
            timeout: 20000,
            forceNew: true, // Ensure fresh connection
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
        });

        socket.on("disconnect", (reason) => {
            setConnected(false);
        });

        socket.on("connect_error", (error) => {
            toast.error(
                "WebSocket connection error: " + (error.message || "Unknown error")
            );
            setConnected(false);
        });

        socket.on("error", (error) => {
            // console.error("🚨 WebSocket error:", error);
            toast.error(error.error || "WebSocket error occurred");
        });

        return () => {
            // console.log("🧹 Cleaning up WebSocket connection");
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setConnected(false);
        };
    }, [roomId, userId]);

    const send = <T,>(event: string, payload: T) => {
        if (socketRef.current && connected) {
            socketRef.current.emit(event, payload);
        }
    };

    return (
        <WebSocketContext.Provider
            value={{ socket: socketRef.current, connected, send }}
        >
            {children}
        </WebSocketContext.Provider>
    );
}
