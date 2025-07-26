import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import TeamAssignmentEditor from "./TeamAssignmentEditor";
import TeamAssignmentView from "./TeamAssignmentView";
import { GameTypeMetadata, LobbyData } from "@/types";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";

export default function TeamAssignmentCard({
    lobbyData,
}: {
    lobbyData: LobbyData;
}) {
    const { socket, connected } = useWebSocket();
    // Dummy data for games; replace with backend/game context later
    const [availableGames] = useState<GameTypeMetadata[]>([]);
    // You can lift these states up if needed for socket/game selection
    const [selectedGame] = useState<string | null>(lobbyData.selectedGameType);
    const selectedGameMetadata = availableGames.find(
        (g) => g.type === selectedGame
    );

    // Get session context
    const { userId, roomId } = useSession();
    // For demo, fallback to dummy users if not provided
    const users = lobbyData.users;
    const leaderId = lobbyData.leaderId;
    const isPartyLeader = userId === leaderId;

    if (!selectedGameMetadata) {
        return null;
    }

    return (
        <Card className="bg-white dark:bg-zinc-900 shadow-md">
            <CardHeader>
                <CardTitle>Team Assignment</CardTitle>
            </CardHeader>
            <CardContent>
                {isPartyLeader ? (
                    <TeamAssignmentEditor
                        users={users}
                        teams={
                            lobbyData.teams ??
                            Array.from(
                                {
                                    length: selectedGameMetadata.numTeams ?? 0,
                                },
                                () => []
                            )
                        }
                        numTeams={selectedGameMetadata.numTeams ?? 0}
                        playersPerTeam={
                            selectedGameMetadata.playersPerTeam ?? 0
                        }
                        onUpdateTeams={(newTeams) => {
                            if (!socket || !connected) {
                                toast.error("Not connected to the server");
                                return;
                            }
                            socket.emit("set_teams", {
                                roomId,
                                userId,
                                teams: newTeams,
                            });
                        }}
                    />
                ) : (
                    <TeamAssignmentView
                        users={users}
                        teams={
                            lobbyData.teams ??
                            Array.from(
                                {
                                    length: selectedGameMetadata.numTeams ?? 0,
                                },
                                () => []
                            )
                        }
                    />
                )}
            </CardContent>
        </Card>
    );
}
