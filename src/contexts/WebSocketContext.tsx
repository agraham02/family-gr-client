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

interface WebSocketContextValue {
    socket: Socket | null;
    connected: boolean;
    send: (event: string, ...args: any[]) => void;
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

    useEffect(() => {
        const roomId =
            typeof window !== "undefined"
                ? sessionStorage.getItem("roomId")
                : null;
        const userId =
            typeof window !== "undefined"
                ? sessionStorage.getItem("userId")
                : null;
        if (!roomId || !userId) return;

        const url =
            process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
        const socket = io(url, {
            query: { roomId, userId },
            transports: ["websocket"],
            autoConnect: true,
        });
        socketRef.current = socket;

        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));

        return () => {
            socket.disconnect();
            setConnected(false);
        };
    }, []);

    const send = (event: string, ...args: any[]) => {
        if (socketRef.current && connected) {
            socketRef.current.emit(event, ...args);
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
