import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSession } from "@/contexts/SessionContext";
import { SpadesData } from "@/types/games/spades";
import { motion } from "motion/react";
import { Trophy, Target, TrendingUp, Users, Crown } from "lucide-react";
import React, { useEffect, useState } from "react";

const AUTO_CONTINUE_SECONDS = 10;

export default function RoundSummaryModal({
    gameData,
    sendGameAction,
}: {
    gameData: SpadesData;
    sendGameAction: (type: string, payload: unknown) => void;
}) {
    const { userId } = useSession();
    const isLeader = userId === gameData.leaderId;
    const isRoundSummary = gameData.phase === "round-summary";
    const isFinished = gameData.phase === "finished";
    const isOpen = isRoundSummary || isFinished;

    // Countdown timer for auto-continue (round summary only)
    const [countdown, setCountdown] = useState(AUTO_CONTINUE_SECONDS);

    useEffect(() => {
        if (!isRoundSummary || !isLeader) {
            setCountdown(AUTO_CONTINUE_SECONDS);
            return;
        }

        const interval = setInterval(() => {
            setCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [isRoundSummary, isLeader]);

    // Determine winning team for finished phase
    const winningTeamId = isFinished
        ? Object.entries(gameData.teams).reduce(
              (maxTeam, [teamId, team]) => {
                  if (!maxTeam) return teamId;
                  const maxScore = gameData.teams[maxTeam]?.score ?? 0;
                  return team.score > maxScore ? teamId : maxTeam;
              },
              null as string | null
          )
        : null;

    const winningTeam = winningTeamId ? gameData.teams[winningTeamId] : null;

    return (
        <Dialog open={isOpen}>
            <DialogContent className="flex flex-col items-center gap-6 max-w-lg bg-slate-900 border-white/10 text-white p-6">
                <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-white">
                    {isFinished ? (
                        <>
                            <Crown className="w-7 h-7 text-yellow-400" />
                            Game Over!
                        </>
                    ) : (
                        <>
                            <Trophy className="w-7 h-7 text-amber-400" />
                            Round {gameData.round} Complete
                        </>
                    )}
                </DialogTitle>

                {/* Game winner announcement */}
                {isFinished && winningTeam && (
                    <motion.div
                        className="text-center mb-2"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="text-xl font-semibold text-yellow-400 mb-2">
                            🎉 Team {Number(winningTeamId) + 1} Wins! 🎉
                        </div>
                        <div className="text-sm text-white/70">
                            {winningTeam.players
                                .map(
                                    (pid) =>
                                        gameData.players[pid]?.name || "Unknown"
                                )
                                .join(" & ")}
                        </div>
                        <div className="text-lg font-bold text-white mt-2">
                            Final Score: {winningTeam.score} points
                        </div>
                    </motion.div>
                )}

                <div className="w-full space-y-4">
                    {/* Section label */}
                    {isFinished && (
                        <div className="text-sm font-medium text-white/60 text-center">
                            Final Standings
                        </div>
                    )}

                    {Object.entries(gameData.teams)
                        .sort(([, a], [, b]) =>
                            isFinished ? b.score - a.score : 0
                        ) // Only sort by score for finished phase
                        .map(([teamId, team], index) => {
                            const roundScore =
                                gameData.roundTeamScores[Number(teamId)] ?? 0;
                            const isPositive = roundScore >= 0;
                            const isWinner = isFinished && teamId === winningTeamId;

                            return (
                                <motion.div
                                    key={teamId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`rounded-xl p-4 ${
                                        isWinner
                                            ? "bg-gradient-to-br from-yellow-500/30 to-amber-600/20 border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/20"
                                            : index === 0
                                            ? "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30"
                                            : "bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {isWinner ? (
                                                <Crown className="w-5 h-5 text-yellow-400" />
                                            ) : (
                                                <Users
                                                    className={`w-5 h-5 ${
                                                        index === 0
                                                            ? "text-blue-400"
                                                            : "text-red-400"
                                                    }`}
                                                />
                                            )}
                                            <span className="font-bold text-lg">
                                                Team {Number(teamId) + 1}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isRoundSummary && (
                                                <motion.div
                                                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                                        isPositive
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : "bg-red-500/20 text-red-400"
                                                    }`}
                                                    initial={{ scale: 0.8 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{
                                                        delay: 0.3 + index * 0.1,
                                                    }}
                                                >
                                                    <TrendingUp
                                                        className={`w-4 h-4 ${
                                                            !isPositive &&
                                                            "rotate-180"
                                                        }`}
                                                    />
                                                    {isPositive ? "+" : ""}
                                                    {roundScore}
                                                </motion.div>
                                            )}
                                            <div
                                                className={`font-bold ${
                                                    isFinished
                                                        ? "text-3xl"
                                                        : "text-2xl"
                                                }`}
                                            >
                                                {team.score}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {team.players.map((pid) => (
                                            <div
                                                key={pid}
                                                className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                                            >
                                                <span className="font-medium text-white/90 truncate max-w-[100px]">
                                                    {gameData.players[pid]
                                                        ?.name || pid}
                                                </span>
                                                {isRoundSummary && (
                                                    <div className="flex gap-3 text-sm">
                                                        <span className="text-white/60">
                                                            <Target className="w-3 h-3 inline mr-1" />
                                                            {gameData.bids[pid]
                                                                ?.amount ?? 0}
                                                        </span>
                                                        <span
                                                            className={
                                                                (gameData
                                                                    .roundTrickCounts[
                                                                    pid
                                                                ] ?? 0) >=
                                                                (gameData.bids[
                                                                    pid
                                                                ]?.amount ?? 0)
                                                                    ? "text-emerald-400"
                                                                    : "text-red-400"
                                                            }
                                                        >
                                                            {gameData
                                                                .roundTrickCounts[
                                                                pid
                                                            ] ?? 0}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        }
                    )}
                </div>

                {/* Continue button (round summary only) */}
                {isRoundSummary && isLeader && (
                    <Button
                        className="mt-2 w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                        onClick={() =>
                            sendGameAction("CONTINUE_AFTER_ROUND_SUMMARY", {})
                        }
                    >
                        Continue {countdown > 0 && `(${countdown}s)`}
                    </Button>
                )}

                {isRoundSummary && !isLeader && (
                    <p className="text-sm text-white/50 text-center">
                        Waiting for the host to continue...
                    </p>
                )}

                {/* Message for finished state */}
                {isFinished && (
                    <div className="text-center mt-2">
                        <p className="text-sm text-white/60">
                            Return to lobby to play again
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
