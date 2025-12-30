import { CreateAndJoinRoomResponse, GameTypeMetadata } from "@/types";
import { API_BASE } from ".";
import { fetchWithRetry, FetchError } from "@/lib/fetchWithRetry";

export async function createRoom(
    userName: string,
    roomName: string
): Promise<CreateAndJoinRoomResponse> {
    const res = await fetchWithRetry(`${API_BASE}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, roomName }),
    });
    if (!res.ok) {
        const errorText = await res.text().catch(() => "Failed to create room");
        throw new FetchError(errorText, res.status, res.statusText);
    }
    return res.json();
}

export async function joinRoom(
    userName: string,
    roomCode: string,
    userId?: string
): Promise<CreateAndJoinRoomResponse> {
    const res = await fetchWithRetry(`${API_BASE}/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, roomCode, userId }),
    });
    if (!res.ok) {
        const errorText = await res.text().catch(() => "Failed to join room");
        throw new FetchError(errorText, res.status, res.statusText);
    }
    return res.json();
}

export async function getAvailableGames(): Promise<{
    games: GameTypeMetadata[];
}> {
    const res = await fetchWithRetry(`${API_BASE}/games`);
    if (!res.ok) {
        const errorText = await res.text().catch(() => "Failed to fetch games");
        throw new FetchError(errorText, res.status, res.statusText);
    }
    return res.json();
}
