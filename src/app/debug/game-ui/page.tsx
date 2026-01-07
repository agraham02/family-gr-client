"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    GameTable,
    TableCenter,
    EdgeRegion,
    CardHand,
    CardDeck,
    PlayerInfo,
    TrickPile,
    EdgePosition,
} from "@/components/games/shared";
import { PlayingCard as PlayingCardType } from "@/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data Generation
// ─────────────────────────────────────────────────────────────────────────────

const SUITS: PlayingCardType["suit"][] = [
    "Spades",
    "Hearts",
    "Diamonds",
    "Clubs",
];
const RANKS = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
];

function generateDeck(): PlayingCardType[] {
    const deck: PlayingCardType[] = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank });
        }
    }
    return deck;
}

function shuffleDeck(deck: PlayingCardType[]): PlayingCardType[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function dealCards(
    deck: PlayingCardType[],
    playerCount: number,
    cardsPerPlayer: number
): PlayingCardType[][] {
    const hands: PlayingCardType[][] = Array.from(
        { length: playerCount },
        () => []
    );
    let cardIndex = 0;

    for (let i = 0; i < cardsPerPlayer; i++) {
        for (let p = 0; p < playerCount; p++) {
            if (cardIndex < deck.length) {
                hands[p].push(deck[cardIndex]);
                cardIndex++;
            }
        }
    }

    return hands;
}

const MOCK_PLAYERS = [
    { id: "player-0", name: "You", isLocal: true },
    { id: "player-1", name: "Alice" },
    { id: "player-2", name: "Bob" },
    { id: "player-3", name: "Charlie" },
    { id: "player-4", name: "Diana" },
    { id: "player-5", name: "Eve" },
    { id: "player-6", name: "Frank" },
    { id: "player-7", name: "Grace" },
];

// Helper function to map player index to edge position
function getEdgePosition(index: number, playerCount: number): EdgePosition {
    // For 4 players: bottom (hero), left, top, right
    if (playerCount === 2) {
        return index === 0 ? "bottom" : "top";
    }
    if (playerCount === 3) {
        if (index === 0) return "bottom";
        if (index === 1) return "left";
        return "right";
    }
    // 4+ players
    if (index === 0) return "bottom";
    if (index === 1) return "left";
    if (index === 2) return "top";
    if (index === 3) return "right";
    // For 5+ players, we'd need corner positions - for now default to top
    return "top";
}

// ─────────────────────────────────────────────────────────────────────────────
// Debug Sandbox Page
// ─────────────────────────────────────────────────────────────────────────────

export default function GameUIDebugPage() {
    // State
    const [playerCount, setPlayerCount] = useState(4);
    const [isDealing, setIsDealing] = useState(false);
    const [showDebugGrid, setShowDebugGrid] = useState(false);
    const [activePlayerIndex, setActivePlayerIndex] = useState(0);
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
        null
    );
    const [hands, setHands] = useState<PlayingCardType[][]>([]);
    const [trickPlays, setTrickPlays] = useState<
        { playerId: string; card: PlayingCardType; playerName: string }[]
    >([]);
    const [deckCount, setDeckCount] = useState(52);

    // Current players based on count
    const players = useMemo(
        () => MOCK_PLAYERS.slice(0, playerCount),
        [playerCount]
    );

    // Deal cards handler
    const handleDeal = useCallback(async () => {
        setIsDealing(true);
        setHands([]);
        setTrickPlays([]);
        setSelectedCardIndex(null);

        // Simulate dealing animation
        await new Promise((resolve) => setTimeout(resolve, 500));

        const deck = shuffleDeck(generateDeck());
        const cardsPerPlayer = Math.floor(52 / playerCount);
        const dealtHands = dealCards(deck, playerCount, cardsPerPlayer);

        // Animate cards appearing one by one
        for (let i = 0; i < cardsPerPlayer; i++) {
            await new Promise((resolve) => setTimeout(resolve, 80));
            setHands((prev) => {
                const newHands = [...prev];
                for (let p = 0; p < playerCount; p++) {
                    if (!newHands[p]) newHands[p] = [];
                    if (dealtHands[p][i]) {
                        newHands[p] = [...newHands[p], dealtHands[p][i]];
                    }
                }
                return newHands;
            });
            setDeckCount((prev) => Math.max(0, prev - playerCount));
        }

        setIsDealing(false);
    }, [playerCount]);

    // Reset handler
    const handleReset = useCallback(() => {
        setHands([]);
        setTrickPlays([]);
        setSelectedCardIndex(null);
        setDeckCount(52);
        setActivePlayerIndex(0);
    }, []);

    // Play card handler
    const handleCardClick = useCallback(
        (index: number, card: PlayingCardType) => {
            if (selectedCardIndex === index) {
                // Play the card
                const playerName = players[0]?.name || "You";
                setTrickPlays((prev) => [
                    ...prev,
                    { playerId: players[0].id, card, playerName },
                ]);
                setHands((prev) => {
                    const newHands = [...prev];
                    newHands[0] = newHands[0].filter((_, i) => i !== index);
                    return newHands;
                });
                setSelectedCardIndex(null);

                // Move to next player
                setActivePlayerIndex((prev) => (prev + 1) % playerCount);
            } else {
                setSelectedCardIndex(index);
            }
        },
        [selectedCardIndex, players, playerCount]
    );

    // Simulate opponent play
    const handleSimulateOpponentPlay = useCallback(() => {
        if (activePlayerIndex === 0 || hands[activePlayerIndex]?.length === 0)
            return;

        const opponentHand = hands[activePlayerIndex];
        if (!opponentHand || opponentHand.length === 0) return;

        const randomIndex = Math.floor(Math.random() * opponentHand.length);
        const card = opponentHand[randomIndex];
        const playerName = players[activePlayerIndex]?.name || "Opponent";

        setTrickPlays((prev) => [
            ...prev,
            { playerId: players[activePlayerIndex].id, card, playerName },
        ]);
        setHands((prev) => {
            const newHands = [...prev];
            newHands[activePlayerIndex] = newHands[activePlayerIndex].filter(
                (_, i) => i !== randomIndex
            );
            return newHands;
        });
        setActivePlayerIndex((prev) => (prev + 1) % playerCount);
    }, [activePlayerIndex, hands, players, playerCount]);

    // Clear trick
    const handleClearTrick = useCallback(() => {
        setTrickPlays([]);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-slate-900">
            {/* Control Panel */}
            <div className="flex-shrink-0 p-4 bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center">
                    <Card className="flex-1 min-w-[200px] bg-slate-700 border-slate-600">
                        <CardHeader className="py-2 px-4">
                            <CardTitle className="text-sm text-white">
                                Players
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                            <div className="flex items-center gap-4">
                                <Slider
                                    value={[playerCount]}
                                    onValueChange={(value) =>
                                        setPlayerCount(value[0])
                                    }
                                    min={2}
                                    max={8}
                                    step={1}
                                    className="flex-1"
                                />
                                <Badge
                                    variant="secondary"
                                    className="w-8 justify-center"
                                >
                                    {playerCount}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 min-w-[200px] bg-slate-700 border-slate-600">
                        <CardHeader className="py-2 px-4">
                            <CardTitle className="text-sm text-white">
                                Active Player
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                            <div className="flex items-center gap-4">
                                <Slider
                                    value={[activePlayerIndex]}
                                    onValueChange={(value) =>
                                        setActivePlayerIndex(value[0])
                                    }
                                    min={0}
                                    max={playerCount - 1}
                                    step={1}
                                    className="flex-1"
                                />
                                <Badge
                                    variant={
                                        activePlayerIndex === 0
                                            ? "default"
                                            : "secondary"
                                    }
                                    className="w-20 justify-center"
                                >
                                    {players[activePlayerIndex]?.name || "—"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleDeal}
                            disabled={isDealing}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isDealing ? "Dealing..." : "Deal Cards"}
                        </Button>
                        <Button
                            onClick={handleSimulateOpponentPlay}
                            disabled={
                                activePlayerIndex === 0 || hands.length === 0
                            }
                            variant="outline"
                        >
                            Simulate Play
                        </Button>
                        <Button onClick={handleClearTrick} variant="outline">
                            Clear Trick
                        </Button>
                        <Button onClick={handleReset} variant="destructive">
                            Reset
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Label
                            htmlFor="debug-grid"
                            className="text-white text-sm"
                        >
                            Debug Grid
                        </Label>
                        <input
                            id="debug-grid"
                            type="checkbox"
                            checked={showDebugGrid}
                            onChange={(e) => setShowDebugGrid(e.target.checked)}
                            className="w-4 h-4"
                        />
                    </div>
                </div>
            </div>

            {/* Game Table - Full viewport size, page scrolls to reveal */}
            <div className="h-screen w-full">
                <GameTable
                    playerCount={playerCount}
                    isDealing={isDealing}
                    showDebugGrid={showDebugGrid}
                >
                    {/* Player Edge Regions */}
                    {players.map((player, index) => {
                        const isLocal = index === 0;
                        const isCurrentTurn = activePlayerIndex === index;
                        const hand = hands[index] || [];
                        const bid = Math.floor(Math.random() * 5) + 1;
                        const tricksWon = Math.floor(Math.random() * (bid + 1));
                        const edgePosition = getEdgePosition(
                            index,
                            playerCount
                        );

                        return (
                            <EdgeRegion
                                key={player.id}
                                position={edgePosition}
                                isHero={isLocal}
                                isDealing={isDealing}
                            >
                                <PlayerInfo
                                    playerId={player.id}
                                    playerName={player.name}
                                    isCurrentTurn={isCurrentTurn}
                                    isLocalPlayer={isLocal}
                                    seatPosition={edgePosition}
                                    bid={hand.length > 0 ? bid : null}
                                    tricksWon={
                                        hand.length > 0 ? tricksWon : undefined
                                    }
                                    teamColor={
                                        index % 2 === 0 ? "#3b82f6" : "#ef4444"
                                    }
                                />
                                <CardHand
                                    cards={isLocal ? hand : []}
                                    cardCount={hand.length}
                                    isLocalPlayer={isLocal}
                                    interactive={isLocal && isCurrentTurn}
                                    selectedIndex={
                                        isLocal ? selectedCardIndex : null
                                    }
                                    onCardClick={
                                        isLocal ? handleCardClick : undefined
                                    }
                                    playerId={player.id}
                                    isDealing={isDealing}
                                />
                            </EdgeRegion>
                        );
                    })}

                    {/* Center Area */}
                    <TableCenter className="flex flex-col items-center gap-4">
                        {/* Show deck when not dealt */}
                        {hands.length === 0 && !isDealing && (
                            <CardDeck
                                cardCount={deckCount}
                                isDealing={isDealing}
                            />
                        )}

                        {/* Show dealing animation */}
                        {isDealing && (
                            <CardDeck
                                cardCount={deckCount}
                                isDealing={isDealing}
                            />
                        )}

                        {/* Trick pile when playing */}
                        {hands.length > 0 && !isDealing && (
                            <>
                                {/* Round indicator */}
                                <motion.div
                                    className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <span className="text-white/80 text-sm font-medium">
                                        Round 1 • Trick {trickPlays.length + 1}
                                    </span>
                                </motion.div>

                                <TrickPile
                                    plays={trickPlays}
                                    winningCard={
                                        trickPlays.length > 0
                                            ? trickPlays[trickPlays.length - 1]
                                                  .card
                                            : undefined
                                    }
                                />
                            </>
                        )}
                    </TableCenter>

                    {/* Turn indicator for local player */}
                    <AnimatePresence>
                        {activePlayerIndex === 0 &&
                            hands.length > 0 &&
                            !isDealing &&
                            selectedCardIndex === null && (
                                <motion.div
                                    className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                >
                                    <div className="bg-blue-500/90 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg">
                                        <span className="text-white font-medium">
                                            Your turn! Select a card to play
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                    </AnimatePresence>

                    {/* Play card confirmation */}
                    <AnimatePresence>
                        {selectedCardIndex !== null &&
                            hands[0]?.[selectedCardIndex] && (
                                <motion.div
                                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-3"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                >
                                    <Button
                                        onClick={() => {
                                            const card =
                                                hands[0][selectedCardIndex];
                                            if (card)
                                                handleCardClick(
                                                    selectedCardIndex,
                                                    card
                                                );
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                                    >
                                        Play Card
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            setSelectedCardIndex(null)
                                        }
                                        variant="outline"
                                        className="shadow-lg"
                                    >
                                        Cancel
                                    </Button>
                                </motion.div>
                            )}
                    </AnimatePresence>
                </GameTable>
            </div>
        </div>
    );
}
