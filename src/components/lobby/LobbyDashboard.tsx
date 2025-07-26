import { useEffect, useState } from "react";
import { getAvailableGames } from "@/services/lobby";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";
import { GameTypeMetadata, LobbyData } from "@/types";
import PlayerListCard from "@/components/lobby/PlayerListCard";
import AvailableGamesCard from "@/components/lobby/AvailableGamesCard";
import TeamAssignmentCard from "@/components/lobby/TeamAssignmentCard";
import RoomControlsCard from "@/components/lobby/RoomControlsCard";

export default function LobbyDashboard({
    lobbyData,
}: {
    lobbyData: LobbyData;
}) {
    const [availableGames, setAvailableGames] = useState<GameTypeMetadata[]>(
        []
    );
    const [selectedGame, setSelectedGame] = useState<string | null>(
        lobbyData.selectedGameType
    );
    const selectedGameMetadata = availableGames.find(
        (g) => g.type === selectedGame
    );

    // Get session context
    const { userId } = useSession();
    const users = lobbyData.users;
    const teams = lobbyData.teams ?? [];
    const leaderId = lobbyData.leaderId;
    const isPartyLeader = userId === leaderId;

    useEffect(() => {
        const fetchAvailableGames = async () => {
            try {
                const { games } = await getAvailableGames();
                setAvailableGames(games);
            } catch (error) {
                if (error instanceof Error && error.message) {
                    toast.error(
                        "Failed to load available games: " + error.message
                    );
                } else {
                    toast.error("Failed to load available games");
                }
            }
        };
        fetchAvailableGames();
    }, []);

    useEffect(() => {
        setSelectedGame(lobbyData.selectedGameType);
    }, [lobbyData.selectedGameType]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl my-8 mx-auto px-5 md:px-10">
            <PlayerListCard
                users={lobbyData.users}
                leaderId={lobbyData.leaderId}
                readyStates={lobbyData.readyStates}
                isPartyLeader={isPartyLeader}
            />

            <AvailableGamesCard
                availableGames={availableGames}
                selectedGame={selectedGame}
                isPartyLeader={isPartyLeader}
            />

            {selectedGameMetadata?.requiresTeams && (
                <TeamAssignmentCard
                    users={users}
                    teams={teams}
                    selectedGameMetadata={selectedGameMetadata}
                    isPartyLeader={isPartyLeader}
                />
            )}

            {isPartyLeader && (
                <RoomControlsCard
                    selectedGame={selectedGame}
                    isPartyLeader={isPartyLeader}
                />
            )}
        </div>
    );
}
