import { useWebSocket } from "@/contexts/WebSocketContext";
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import GameTable from "./ui/GameTable";
import SpadesGameInfo from "./ui/SpadesGameInfo";
import { SpadesData, SpadesPlayerData } from "@/types";

function PlaceBidModal({
    isMyTurn,
    isBiddingPhase,
    bid,
    handleBidChange,
    handleSubmitBid,
}: {
    isMyTurn: boolean;
    isBiddingPhase: boolean;
    bid: number;
    handleBidChange: (delta: number) => void;
    handleSubmitBid: () => void;
}) {
    return (
        <Dialog open={!!isMyTurn && isBiddingPhase}>
            <DialogContent className="flex flex-col items-center gap-4">
                <div className="text-lg font-semibold mb-2">Your Bid</div>
                <div className="flex items-center gap-6">
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleBidChange(-1)}
                        aria-label="Decrease bid"
                    >
                        -
                    </Button>
                    <span className="text-3xl font-bold w-12 text-center">
                        {bid}
                    </span>
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleBidChange(1)}
                        aria-label="Increase bid"
                    >
                        +
                    </Button>
                </div>
                <Button className="mt-4 w-full" onClick={handleSubmitBid}>
                    Submit Bid
                </Button>
            </DialogContent>
        </Dialog>
    );
}

export default function Spades({
    gameData,
    playerData,
}: {
    gameData: SpadesData;
    playerData: SpadesPlayerData;
}) {
    const { socket, connected } = useWebSocket();
    // For demo, get userId from session context (replace with prop/context as needed)
    const { roomId, userId } = useSession();

    function sendGameAction(type: string, payload: unknown) {
        if (!socket || !connected) return;
        const action = {
            type,
            payload,
            userId,
        };
        socket.emit("game_action", { roomId, action });
    }

    // Assume gameData has phase, players, currentIndex, and bids fields
    const isBiddingPhase = gameData.phase === "bidding";
    const isMyTurn = gameData.playOrder[gameData.currentTurnIndex] === userId;
    const [bid, setBid] = useState<number>(0);

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
            />
            <PlaceBidModal
                isMyTurn={isMyTurn}
                isBiddingPhase={isBiddingPhase}
                bid={bid}
                handleBidChange={handleBidChange}
                handleSubmitBid={handleSubmitBid}
            />
        </div>
    );
}
