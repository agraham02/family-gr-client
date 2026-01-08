"use client";
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    ReactNode,
} from "react";

interface SessionContextValue {
    roomId: string;
    setRoomId: (id: string) => void;
    userId: string;
    setUserId: (id: string) => void;
    userName: string;
    setUserName: (name: string) => void;
    setSessionData: (data: {
        roomId?: string;
        userId?: string;
        userName?: string;
    }) => void;
    initializing: boolean;
    clearSession: () => void;
    clearRoomSession: () => void;
    clearUserSession: () => void;
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
    const prevValuesRef = useRef({ roomId: "", userId: "", userName: "" });

    useEffect(() => {
        if (typeof window !== "undefined") {
            // Use localStorage for persistence across browser sessions (enables rejoin after tab close)
            const storedRoomId = localStorage.getItem("roomId") ?? "";
            const storedUserId = localStorage.getItem("userId") ?? "";
            const storedUserName = localStorage.getItem("userName") ?? "";
            setRoomIdState(storedRoomId);
            setUserIdState(storedUserId);
            setUserNameState(storedUserName);
            prevValuesRef.current = {
                roomId: storedRoomId,
                userId: storedUserId,
                userName: storedUserName,
            };
            setInitializing(false);
        }
    }, []);

    // Atomic sync to localStorage - prevents race conditions on tab close
    useEffect(() => {
        if (initializing) return; // Don't write during initialization

        // Only update localStorage if values actually changed
        const prev = prevValuesRef.current;
        let changed = false;

        if (roomId && roomId !== prev.roomId) {
            localStorage.setItem("roomId", roomId);
            prev.roomId = roomId;
            changed = true;
        }
        if (userId && userId !== prev.userId) {
            localStorage.setItem("userId", userId);
            prev.userId = userId;
            changed = true;
        }
        if (userName && userName !== prev.userName) {
            localStorage.setItem("userName", userName);
            prev.userName = userName;
            changed = true;
        }

        // Log only if something changed for debugging
        if (changed) {
            console.log("Session updated:", { roomId, userId, userName });
        }
    }, [roomId, userId, userName, initializing]);

    // Setters that update state and localStorage
    const setRoomId = (id: string) => {
        setRoomIdState(id);
    };
    const setUserId = (id: string) => {
        setUserIdState(id);
    };
    const setUserName = (name: string) => {
        setUserNameState(name);
    };

    // Batch setter to update all session values at once (prevents multiple re-renders)
    const setSessionData = (data: {
        roomId?: string;
        userId?: string;
        userName?: string;
    }) => {
        if (data.userName !== undefined) setUserNameState(data.userName);
        if (data.userId !== undefined) setUserIdState(data.userId);
        if (data.roomId !== undefined) setRoomIdState(data.roomId);
    };

    // Clear session data (useful when leaving room or on error)
    const clearSession = () => {
        setRoomIdState("");
        setUserIdState("");
        setUserNameState("");
        localStorage.removeItem("roomId");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
    };

    // Clear room-specific session data but preserve userName and userId
    // Useful when kicked or room is closed - user shouldn't have to re-enter name
    const clearRoomSession = () => {
        setRoomIdState("");
        localStorage.removeItem("roomId");
    };

    // Clear userId and roomId but preserve userName
    // Useful when user needs a completely fresh identity (e.g., kicked)
    const clearUserSession = () => {
        setRoomIdState("");
        setUserIdState("");
        localStorage.removeItem("roomId");
        localStorage.removeItem("userId");
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
                setSessionData,
                initializing,
                clearSession,
                clearRoomSession,
                clearUserSession,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}
