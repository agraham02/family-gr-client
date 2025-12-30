"use client";
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

interface SessionContextValue {
    roomId: string;
    setRoomId: (id: string) => void;
    userId: string;
    setUserId: (id: string) => void;
    userName: string;
    setUserName: (name: string) => void;
    initializing: boolean;
    clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(
    undefined
);

export function useSession() {
    const ctx = useContext(SessionContext);
    if (!ctx)
        throw new Error("useSession must be used within a SessionProvider");
    return ctx;
}

export function SessionProvider({ children }: { children: ReactNode }) {
    const [roomId, setRoomIdState] = useState<string>("");
    const [userId, setUserIdState] = useState<string>("");
    const [userName, setUserNameState] = useState<string>("");
    const [initializing, setInitializing] = useState<boolean>(true);

    useEffect(() => {
        if (typeof window !== "undefined") {
            // Use localStorage for persistence across browser sessions (enables rejoin after tab close)
            const storedRoomId = localStorage.getItem("roomId") ?? "";
            const storedUserId = localStorage.getItem("userId") ?? "";
            const storedUserName = localStorage.getItem("userName") ?? "";
            setRoomId(storedRoomId);
            setUserId(storedUserId);
            setUserName(storedUserName);
            setInitializing(false);
        }
    }, []);

    // Sync to localStorage on change
    useEffect(() => {
        if (roomId) localStorage.setItem("roomId", roomId);
    }, [roomId]);
    useEffect(() => {
        if (userId) localStorage.setItem("userId", userId);
    }, [userId]);
    useEffect(() => {
        if (userName) localStorage.setItem("userName", userName);
    }, [userName]);

    // Setters that update state and localStorage
    const setRoomId = (id: string) => setRoomIdState(id);
    const setUserId = (id: string) => setUserIdState(id);
    const setUserName = (name: string) => setUserNameState(name);

    // Clear session data (useful when leaving room or on error)
    const clearSession = () => {
        setRoomIdState("");
        setUserIdState("");
        setUserNameState("");
        localStorage.removeItem("roomId");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
    };

    return (
        <SessionContext.Provider
            value={{
                roomId,
                setRoomId,
                userId,
                setUserId,
                userName,
                setUserName,
                initializing,
                clearSession,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}
