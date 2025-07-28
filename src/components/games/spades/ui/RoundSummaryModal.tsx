import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/contexts/SessionContext";
import { SpadesData } from "@/types/games/spades";
import React from "react";

export default function RoundSummaryModal({
    gameData,
    sendGameAction,
}: {
    gameData: SpadesData;
    sendGameAction: (type: string, payload: unknown) => void;
}) {
    const { userId } = useSession();

    return (
        <Dialog open={gameData.phase === "round-summary"}>
            <DialogContent className="flex flex-col items-center gap-4 max-w-lg">
                <DialogTitle>
                    <span className="text-2xl font-bold text-cyan-700 mb-2">
                        Round Summary
                    </span>
                </DialogTitle>
                <div className="w-full text-left flex flex-col gap-6">
                    {Object.entries(gameData.teams).map(([teamId, team]) => (
                        <div
                            key={teamId}
                            className="rounded-xl bg-gradient-to-br from-cyan-50/80 to-white/80 border border-cyan-200 shadow-sm p-4 flex flex-col gap-2"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-lg text-cyan-700">
                                    Team {teamId}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                {team.players.map((pid) => (
                                    <div
                                        key={pid}
                                        className="flex items-center gap-3 bg-white/60 rounded-md px-3 py-2 shadow-sm"
                                    >
                                        <span className="font-semibold text-cyan-700 text-base">
                                            {gameData.players[pid]?.name || pid}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Bid:{" "}
                                            <span className="font-bold text-gray-700">
                                                {gameData.bids[pid]?.amount ??
                                                    0}
                                            </span>
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Tricks:{" "}
                                            <span className="font-bold text-gray-700">
                                                {gameData.roundTrickCounts[
                                                    pid
                                                ] ?? 0}
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col gap-1 mt-2">
                                <span className="text-sm text-gray-700">
                                    Team Round Score:{" "}
                                    <span className="font-bold text-cyan-800">
                                        {gameData.roundTeamScores[
                                            Number(teamId)
                                        ] ?? 0}
                                    </span>
                                </span>
                                <span className="text-sm text-gray-700">
                                    Total Team Score:{" "}
                                    <span className="font-bold text-cyan-800">
                                        {team.score}
                                    </span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {userId === gameData.leaderId && (
                    <Button
                        className="mt-6 w-full text-base font-semibold py-3 rounded-lg shadow-md transition-colors"
                        onClick={() =>
                            sendGameAction("CONTINUE_AFTER_ROUND_SUMMARY", {})
                        }
                    >
                        Continue
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
}
