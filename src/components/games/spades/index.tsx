import { useWebSocket } from "@/contexts/WebSocketContext";
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import SpadesGameTable from "./ui/SpadesGameTable";
import { GameScoreboard } from "@/components/games/shared";
import { SpadesData, SpadesPlayerData, PlayingCard } from "@/types";
import PlaceBidModal from "./ui/PlaceBidModal";
import RoundSummaryModal from "./ui/RoundSummaryModal";

export default function Spades({
    gameData,
    playerData,
}: {
    gameData: SpadesData;
    playerData: SpadesPlayerData;
}) {
    const { socket, connected } = useWebSocket();
    const { roomId, userId } = useSession();

    const sendGameAction = React.useCallback(
        (type: string, payload: unknown) => {
            if (!socket || !connected) return;
            const action = {
                type,
                payload,
                userId,
            };
            socket.emit("game_action", { roomId, action });
        },
        [socket, connected, userId, roomId]
    );

    // Assume gameData has phase, players, currentIndex, and bids fields
    const isBiddingPhase = gameData.phase === "bidding";
    const isMyTurn = gameData.playOrder[gameData.currentTurnIndex] === userId;
    const [bid, setBid] = useState<number>(0);
    const [bidModalOpen, setBidModalOpen] = useState(false);

    function handleBidChange(delta: number) {
        setBid((prev: number) => Math.max(0, prev + delta));
    }

    function handleSubmitBid() {
        if (!isMyTurn) return;
        sendGameAction("PLACE_BID", { bid: { amount: bid } });
        setBid(0); // Reset bid after submitting
    }

    const handleCardPlay = useCallback(
        (card: PlayingCard) => {
            if (!isMyTurn) return;
            sendGameAction("PLAY_CARD", { card });
        },
        [isMyTurn, sendGameAction]
    );

    // Build team scores for scoreboard
    const teamScores = Object.entries(gameData.teams).map(([teamId, team]) => ({
        teamId,
        teamName: `Team ${Number(teamId) + 1}`,
        players: team.players.map((pid) => gameData.players[pid]?.name || pid),
        score: team.score,
        roundScore: gameData.roundTeamScores?.[Number(teamId)],
    }));

    // Build player bids for scoreboard
    const playerBids = gameData.playOrder.map((playerId) => ({
        playerId,
        playerName: gameData.players[playerId]?.name || playerId,
        bid: gameData.bids[playerId]?.amount ?? null,
        tricksWon: gameData.roundTrickCounts?.[playerId] ?? 0,
    }));

    useEffect(() => {
        if (isMyTurn && isBiddingPhase) {
            setBidModalOpen(true);
        } else {
            setBidModalOpen(false);
        }
        if (gameData.phase === "trick-result" && userId === gameData.leaderId) {
            const timer = setTimeout(() => {
                sendGameAction("CONTINUE_AFTER_TRICK_RESULT", {});
            }, 3000); // 3 seconds

            return () => clearTimeout(timer);
        }
        // Auto-continue from round-summary after timeout (includes on refresh/mount)
        if (
            gameData.phase === "round-summary" &&
            userId === gameData.leaderId
        ) {
            const timer = setTimeout(() => {
                sendGameAction("CONTINUE_AFTER_ROUND_SUMMARY", {});
            }, 10000); // 10 seconds to allow viewing the summary

            return () => clearTimeout(timer);
        }
    }, [
        gameData.phase,
        isMyTurn,
        isBiddingPhase,
        userId,
        gameData.leaderId,
        sendGameAction,
    ]);

    return (
        <div className="h-screen w-full overflow-hidden">
            <SpadesGameTable
                gameData={gameData}
                playerData={playerData}
                isMyTurn={isMyTurn}
                onCardPlay={handleCardPlay}
            />

            {/* Scoreboard */}
            <GameScoreboard
                teams={teamScores}
                playerBids={playerBids}
                round={gameData.round}
                phase={gameData.phase}
                winTarget={gameData.settings?.winTarget}
            />

            <Button
                className="fixed bottom-6 right-6 z-40 px-4 py-2 rounded-lg shadow-md bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                onClick={() => setBidModalOpen(true)}
                style={{
                    display:
                        isMyTurn && isBiddingPhase && !bidModalOpen
                            ? "block"
                            : "none",
                }}
            >
                Place Bid
            </Button>
            <PlaceBidModal
                bid={bid}
                bidModalOpen={bidModalOpen}
                setBidModalOpen={setBidModalOpen}
                handleBidChange={handleBidChange}
                handleSubmitBid={handleSubmitBid}
            />

            {/* Round Summary Modal */}
            <RoundSummaryModal
                gameData={gameData}
                sendGameAction={sendGameAction}
            />
        </div>
    );
}
