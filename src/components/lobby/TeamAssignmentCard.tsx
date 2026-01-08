import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import TeamAssignmentEditor from "./TeamAssignmentEditor";
import TeamAssignmentView from "./TeamAssignmentView";
import { GameTypeMetadata, User } from "@/types";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";
import { UsersRoundIcon, LockIcon } from "lucide-react";

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
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-zinc-900/90 border-zinc-200/50 dark:border-zinc-700/50 shadow-lg">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <UsersRoundIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        Team Assignment
                    </CardTitle>
                    {!isPartyLeader && (
                        <Badge variant="outline" className="text-xs gap-1">
                            <LockIcon className="w-3 h-3" />
                            View only
                        </Badge>
                    )}
                </div>
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
