import { useWebSocket } from "@/contexts/WebSocketContext";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import GameTable from "./ui/GameTable";
import SpadesGameInfo from "./ui/SpadesGameInfo";
import { SpadesData, SpadesPlayerData } from "@/types";
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

    function handleCardPlay(card: { suit: string; rank: string }) {
        if (!isMyTurn) return;
        sendGameAction("PLAY_CARD", { card });
    }

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
        <div className="h-full w-full">
            <div className="h-[90vh] w-full">
                <GameTable
                    gameData={gameData}
                    playerData={playerData}
                    handleCardPlay={handleCardPlay}
                />
            </div>
            <SpadesGameInfo
                players={gameData.players}
                teams={gameData.teams}
                bids={gameData.bids}
                playOrder={gameData.playOrder}
                roundTrickCounts={gameData.roundTrickCounts}
                phase={gameData.phase}
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
