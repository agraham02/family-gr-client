import React from "react";
import { Card } from "@/components/ui/card";
import { Players } from "@/types";

interface Team {
    players: string[];
    score: number;
}

interface SpadesGameInfoProps {
    players: Players;
    teams: Record<string, Team>;
    bids: Record<string, { amount: number }>;
    playOrder: string[];
}

export default function SpadesGameInfo({
    players,
    teams,
    bids,
    playOrder,
}: SpadesGameInfoProps) {
    // Helper to get player name by id
    const getPlayerName = (id: string) => players[id]?.name || id;

    return (
        <div className="w-full flex flex-col md:flex-row gap-4 md:gap-8 p-2 md:p-4">
            {/* Teams and scores */}
            <div className="flex-1 flex flex-col gap-2">
                <div className="text-lg font-bold mb-2">Teams</div>
                <div className="flex flex-col gap-2">
                    {Object.entries(teams).map(([teamId, team]) => (
                        <Card
                            key={teamId}
                            className="p-2 flex flex-col md:flex-row md:items-center gap-2"
                        >
                            <div className="font-semibold">Team {teamId}</div>
                            <div className="flex flex-wrap gap-2">
                                {team.players.map((pid) => (
                                    <span
                                        key={pid}
                                        className="bg-blue-700/80 text-white rounded px-2 py-1 text-xs md:text-sm shadow"
                                    >
                                        {getPlayerName(pid)}
                                    </span>
                                ))}
                            </div>
                            <div className="ml-auto font-bold text-sm md:text-lg">
                                Score: {team.score}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
            {/* Player bids */}
            <div className="flex-1 flex flex-col gap-2">
                <div className="text-lg font-bold mb-2">Bids</div>
                <div className="flex flex-col gap-2">
                    {playOrder.map((pid) => (
                        <Card
                            key={pid}
                            className="p-2 flex flex-row items-center gap-2"
                        >
                            <span className="font-semibold w-8 md:w-12">
                                {getPlayerName(pid)}
                            </span>
                            <span className="ml-2 text-sm md:text-base">
                                Bid:{" "}
                                <span className="font-bold">
                                    {bids[pid]?.amount ?? "-"}
                                </span>
                            </span>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
