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
    const [roomId, setRoomIdState] = useState<string>(
        typeof window !== "undefined"
            ? sessionStorage.getItem("roomId") ?? ""
            : ""
    );
    const [userId, setUserIdState] = useState<string>(
        typeof window !== "undefined"
            ? sessionStorage.getItem("userId") ?? ""
            : ""
    );
    const [userName, setUserNameState] = useState<string>(
        typeof window !== "undefined"
            ? sessionStorage.getItem("userName") ?? ""
            : ""
    );

    // Sync to sessionStorage on change
    useEffect(() => {
        if (roomId) sessionStorage.setItem("roomId", roomId);
    }, [roomId]);
    useEffect(() => {
        if (userId) sessionStorage.setItem("userId", userId);
    }, [userId]);
    useEffect(() => {
        if (userName) sessionStorage.setItem("userName", userName);
    }, [userName]);

    // Setters that update state and sessionStorage
    const setRoomId = (id: string) => setRoomIdState(id);
    const setUserId = (id: string) => setUserIdState(id);
    const setUserName = (name: string) => setUserNameState(name);

    return (
        <SessionContext.Provider
            value={{
                roomId,
                setRoomId,
                userId,
                setUserId,
                userName,
                setUserName,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}
