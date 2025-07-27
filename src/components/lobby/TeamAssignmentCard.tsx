import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import TeamAssignmentEditor from "./TeamAssignmentEditor";
import TeamAssignmentView from "./TeamAssignmentView";
import { GameTypeMetadata, User } from "@/types";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";

export default function TeamAssignmentCard({
    users,
    teams,
    selectedGameMetadata,
    isPartyLeader,
}: {
    users: User[];
    teams: string[][];
    selectedGameMetadata: GameTypeMetadata | undefined;
    isPartyLeader: boolean;
}) {
    const { socket, connected } = useWebSocket();
    const { userId, roomId } = useSession();

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
                            teams ??
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
                            teams ??
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
