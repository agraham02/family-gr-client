import { useWebSocket } from "@/contexts/WebSocketContext";
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import SpadesGameTable from "./ui/SpadesGameTable";
import {
    GameScoreboard,
    GameMenu,
    GameSettingToggle,
    useGameSetting,
} from "@/components/games/shared";
import { SpadesData, SpadesPlayerData, PlayingCard } from "@/types";
import PlaceBidModal from "./ui/PlaceBidModal";
import BlindBidModal from "./ui/BlindBidModal";
import RoundSummaryModal from "./ui/RoundSummaryModal";
import { Lightbulb } from "lucide-react";

export default function Spades({
    gameData,
    playerData,
    dispatchOptimisticAction,
    roomCode,
}: {
    gameData: SpadesData;
    playerData: SpadesPlayerData;
    dispatchOptimisticAction?: (type: string, payload: unknown) => void;
    roomCode?: string;
}) {
    const { socket, connected } = useWebSocket();
    const { roomId, userId } = useSession();

    const sendGameAction = React.useCallback(
        (type: string, payload: unknown) => {
            // Use optimistic action dispatcher if available, otherwise fallback to direct emit
            if (dispatchOptimisticAction) {
                dispatchOptimisticAction(type, payload);
            } else {
                // Fallback for backwards compatibility
                if (!socket || !connected) return;
                const action = {
                    type,
                    payload,
                    userId,
                };
                socket.emit("game_action", { roomId, action });
            }
        },
        [dispatchOptimisticAction, socket, connected, userId, roomId]
    );

    // For non-player system actions (CONTINUE_AFTER_TRICK_RESULT, CONTINUE_AFTER_ROUND_SUMMARY)
    // These don't need optimistic updates and shouldn't block player actions
    const sendSystemAction = React.useCallback(
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
    const isLeader = userId === gameData.leaderId;
    const showHints = useGameSetting("spades.showHints", false);
    const [bid, setBid] = useState<number>(0);
    const [bidModalOpen, setBidModalOpen] = useState(false);
    const [blindBidModalOpen, setBlindBidModalOpen] = useState(false);
    const [hasSeenCards, setHasSeenCards] = useState(false);

    // Reset hasSeenCards at start of each bidding phase
    useEffect(() => {
        if (isBiddingPhase) {
            setHasSeenCards(false);
        }
    }, [isBiddingPhase, gameData.round]);

    function handleBidChange(delta: number) {
        setBid((prev: number) => Math.max(0, Math.min(13, prev + delta)));
    }

    function handleSubmitBid(isNil: boolean) {
        if (!isMyTurn) return;
        const bidData = {
            amount: isNil ? 0 : bid,
            type: isNil ? "nil" : "normal",
            isBlind: false,
        };
        sendGameAction("PLACE_BID", { bid: bidData });
        setBid(0); // Reset bid after submitting
    }

    function handleBlindNil() {
        sendGameAction("PLACE_BID", {
            bid: { amount: 0, type: "blind-nil", isBlind: true },
        });
        setBlindBidModalOpen(false);
        setHasSeenCards(true);
    }

    function handleBlindBid(amount: number) {
        sendGameAction("PLACE_BID", {
            bid: { amount, type: "blind", isBlind: true },
        });
        setBlindBidModalOpen(false);
        setHasSeenCards(true);
    }

    function handleDeclineBlind() {
        setBlindBidModalOpen(false);
        setHasSeenCards(true);
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
                sendSystemAction("CONTINUE_AFTER_TRICK_RESULT", {});
            }, 3000); // 3 seconds

            return () => clearTimeout(timer);
        }
        // Auto-continue from round-summary after timeout (includes on refresh/mount)
        if (
            gameData.phase === "round-summary" &&
            userId === gameData.leaderId
        ) {
            const timer = setTimeout(() => {
                sendSystemAction("CONTINUE_AFTER_ROUND_SUMMARY", {});
            }, 10000); // 10 seconds to allow viewing the summary

            return () => clearTimeout(timer);
        }
    }, [
        gameData.phase,
        isMyTurn,
        isBiddingPhase,
        userId,
        gameData.leaderId,
        sendSystemAction,
    ]);

    return (
        <div className="h-screen w-full overflow-hidden">
            <SpadesGameTable
                gameData={gameData}
                playerData={playerData}
                isMyTurn={isMyTurn}
                onCardPlay={handleCardPlay}
                showHints={showHints}
            />

            {/* Game Menu */}
            <GameMenu isLeader={isLeader} roomCode={roomCode || roomId}>
                <GameSettingToggle
                    storageKey="spades.showHints"
                    label="Show Valid Moves"
                    icon={<Lightbulb className="h-4 w-4" />}
                    defaultValue={false}
                />
            </GameMenu>

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

            {/* Blind Bid Modal - shown first if eligible */}
            {(() => {
                // Find player's team
                let playerTeamId: number | undefined;
                Object.entries(gameData.teams).forEach(([teamId, team]) => {
                    if (team.players.includes(userId)) {
                        playerTeamId = Number(teamId);
                    }
                });

                const isEligible =
                    playerTeamId !== undefined &&
                    (gameData.teamEligibleForBlind?.[playerTeamId] || false);
                const canBlindNil =
                    isEligible &&
                    gameData.settings.allowNil &&
                    gameData.settings.blindNilEnabled;
                const canBlindBid =
                    isEligible && gameData.settings.blindBidEnabled;

                // Calculate team score deficit
                let teamScoreDeficit = 0;
                if (playerTeamId !== undefined) {
                    const maxScore = Math.max(
                        ...Object.values(gameData.teams).map((t) => t.score),
                        0
                    );
                    teamScoreDeficit =
                        maxScore - gameData.teams[playerTeamId].score;
                }

                // Show blind bid modal if:
                // 1. It's my turn during bidding
                // 2. I haven't seen my cards yet
                // 3. My team is eligible
                // 4. Either blind nil or blind bid is enabled
                const shouldShowBlindModal =
                    isMyTurn &&
                    isBiddingPhase &&
                    !hasSeenCards &&
                    isEligible &&
                    (canBlindNil || canBlindBid);

                useEffect(() => {
                    if (shouldShowBlindModal) {
                        setBlindBidModalOpen(true);
                    }
                }, [shouldShowBlindModal]);

                return (
                    <BlindBidModal
                        isOpen={blindBidModalOpen && shouldShowBlindModal}
                        onClose={handleDeclineBlind}
                        canBlindNil={canBlindNil}
                        canBlindBid={canBlindBid}
                        teamScoreDeficit={teamScoreDeficit}
                        onChooseBlindNil={handleBlindNil}
                        onChooseBlindBid={handleBlindBid}
                    />
                );
            })()}

            <PlaceBidModal
                bid={bid}
                bidModalOpen={bidModalOpen && hasSeenCards}
                setBidModalOpen={setBidModalOpen}
                handleBidChange={handleBidChange}
                handleSubmitBid={handleSubmitBid}
                allowNil={gameData.settings.allowNil}
            />

            {/* Round Summary Modal */}
            <RoundSummaryModal
                gameData={gameData}
                sendGameAction={sendGameAction}
            />
        </div>
    );
}
