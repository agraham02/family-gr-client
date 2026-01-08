import { useEffect, useState, useCallback } from "react";
import { getAvailableGames } from "@/services/lobby";
import { useSession } from "@/contexts/SessionContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { toast } from "sonner";
import { GameTypeMetadata, LobbyData, GameSettings } from "@/types";
import { motion } from "framer-motion";
import PlayerListCard from "@/components/lobby/PlayerListCard";
import AvailableGamesCard from "@/components/lobby/AvailableGamesCard";
import TeamAssignmentCard from "@/components/lobby/TeamAssignmentCard";
import RoomControlsCard from "@/components/lobby/RoomControlsCard";
import GameSettingsCard from "@/components/lobby/GameSettingsCard";

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
    const [gameSettings, setGameSettings] = useState<GameSettings>(
        lobbyData.gameSettings ?? {}
    );
    const selectedGameMetadata = availableGames.find(
        (g) => g.type === selectedGame
    );

    // Get session and socket context
    const { userId, roomId } = useSession();
    const { socket, connected } = useWebSocket();
    const users = lobbyData.users;
    const teams = lobbyData.teams ?? [];
    const leaderId = lobbyData.leaderId;
    const isPartyLeader = userId === leaderId;

    useEffect(() => {
        async function fetchAvailableGames() {
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
        }
        fetchAvailableGames();
    }, []);

    useEffect(() => {
        setSelectedGame(lobbyData.selectedGameType);
    }, [lobbyData.selectedGameType]);

    useEffect(() => {
        setGameSettings(lobbyData.gameSettings ?? {});
    }, [lobbyData.gameSettings]);

    // Handle game settings changes
    const handleGameSettingsChange = useCallback(
        (newSettings: GameSettings) => {
            if (!socket || !connected || !isPartyLeader) return;
            setGameSettings(newSettings);
            socket.emit("update_game_settings", {
                roomId,
                userId,
                gameSettings: newSettings,
            });
        },
        [socket, connected, roomId, userId, isPartyLeader]
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 w-full max-w-6xl mx-auto mt-6 md:mt-8 px-0"
        >
            {/* Left Column - Players */}
            <motion.div variants={itemVariants} className="lg:col-span-4">
                <PlayerListCard
                    users={lobbyData.users}
                    leaderId={lobbyData.leaderId}
                    readyStates={lobbyData.readyStates}
                    isPartyLeader={isPartyLeader}
                />
            </motion.div>

            {/* Middle Column - Games & Game Settings */}
            <motion.div
                variants={itemVariants}
                className="lg:col-span-4 flex flex-col gap-4 md:gap-6"
            >
                <AvailableGamesCard
                    availableGames={availableGames}
                    selectedGame={selectedGame}
                    isPartyLeader={isPartyLeader}
                />
                {selectedGame && (
                    <GameSettingsCard
                        gameType={selectedGame}
                        settings={gameSettings}
                        onSettingsChange={handleGameSettingsChange}
                        isLeader={isPartyLeader}
                    />
                )}
            </motion.div>

            {/* Right Column - Teams & Controls */}
            <motion.div
                variants={itemVariants}
                className="lg:col-span-4 flex flex-col gap-4 md:gap-6"
            >
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
                        roomSettings={lobbyData.settings}
                        gameSettings={gameSettings}
                    />
                )}
            </motion.div>
        </motion.div>
    );
}
