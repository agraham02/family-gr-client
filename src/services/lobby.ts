import { CreateAndJoinRoomResponse, GameTypeMetadata } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function createRoom(
    userName: string,
    roomName: string
): Promise<CreateAndJoinRoomResponse> {
    const res = await fetch(`${API_BASE}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, roomName }),
    });
    if (!res.ok) throw new Error("Failed to create room");
    return res.json();
}

export async function joinRoom(
    userName: string,
    roomCode: string,
    userId?: string
): Promise<CreateAndJoinRoomResponse> {
    const res = await fetch(`${API_BASE}/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, roomCode, userId }),
    });
    if (!res.ok) throw new Error("Failed to join room");
    return res.json();
}

export async function getAvailableGames(): Promise<{
    games: GameTypeMetadata[];
}> {
    const res = await fetch(`${API_BASE}/games`);
    if (!res.ok) throw new Error("Failed to fetch available games");
    return res.json();
}
