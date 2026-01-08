"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { toast } from "sonner";
import {
    GameTable,
    TableCenter,
    EdgeRegion,
    CardHand,
    CardDeck,
    PlayerInfo,
    TrickPile,
    EdgePosition,
    ActionConfirmationBar,
    DealingOverlay,
    DealingItem,
    GameScoreboard,
} from "@/components/games/shared";
import {
    getRegisteredGameTypes,
    getGameDisplayName,
    getMockDataGenerator,
} from "@/components/games/registry";
import {
    PlayingCard as PlayingCardType,
    SpadesData,
    SpadesPlayerData,
    DominoesData,
    DominoesPlayerData,
    Tile as TileType,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Import game-specific UI components for display
import Board from "@/components/games/dominoes/ui/Board";
import TileHand from "@/components/games/dominoes/ui/TileHand";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type GameType = "spades" | "dominoes";

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getEdgePosition(index: number, playerCount: number): EdgePosition {
    if (playerCount === 2) {
        return index === 0 ? "bottom" : "top";
    }
    if (playerCount === 3) {
        if (index === 0) return "bottom";
        if (index === 1) return "left";
        return "right";
    }
    if (index === 0) return "bottom";
    if (index === 1) return "left";
    if (index === 2) return "top";
    if (index === 3) return "right";
    return "top";
}

// ─────────────────────────────────────────────────────────────────────────────
// Spades Debug Panel
// ─────────────────────────────────────────────────────────────────────────────

interface SpadesDebugPanelProps {
    gameData: SpadesData;
    playerData: SpadesPlayerData;
    activePlayerIndex: number;
    selectedCardIndex: number | null;
    onCardSelect: (index: number, card: PlayingCardType) => void;
    onPlayCard: () => void;
    onCancelSelection: () => void;
    isDealing: boolean;
    showDebugGrid: boolean;
}

function SpadesDebugPanel({
    gameData,
    playerData,
    activePlayerIndex,
    selectedCardIndex,
    onCardSelect,
    onPlayCard,
    onCancelSelection,
    isDealing,
    showDebugGrid,
}: SpadesDebugPanelProps) {
    const playerCount = playerData.localOrdering.length;
    const trickPlays =
        gameData.currentTrick?.plays.map((play) => ({
            playerId: play.playerId,
            card: play.card,
            playerName: gameData.players[play.playerId]?.name || "Unknown",
        })) ?? [];

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

    return (
        <div className="h-screen w-full relative">
            <LayoutGroup>
                <GameTable
                    playerCount={playerCount}
                    isDealing={isDealing}
                    showDebugGrid={showDebugGrid}
                >
                    {/* Player Edge Regions */}
                    {playerData.localOrdering.map((playerId, index) => {
                        const isLocal = index === 0;
                        const player = gameData.players[playerId];
                        const isCurrentTurn = activePlayerIndex === index;
                        const bid = gameData.bids[playerId]?.amount ?? null;
                        const tricksWon =
                            gameData.roundTrickCounts?.[playerId] ?? 0;
                        const edgePosition = getEdgePosition(
                            index,
                            playerCount
                        );

                        // Get team color
                        let teamColor: string | undefined;
                        Object.entries(gameData.teams).forEach(
                            ([teamId, team]) => {
                                if (team.players.includes(playerId)) {
                                    teamColor =
                                        teamId === "0" ? "#3b82f6" : "#ef4444";
                                }
                            }
                        );

                        return (
                            <EdgeRegion
                                key={playerId}
                                position={edgePosition}
                                isHero={isLocal}
                                isDealing={isDealing}
                            >
                                <PlayerInfo
                                    playerId={playerId}
                                    playerName={player?.name || "Unknown"}
                                    isCurrentTurn={isCurrentTurn && !isDealing}
                                    isLocalPlayer={isLocal}
                                    seatPosition={edgePosition}
                                    bid={bid}
                                    tricksWon={tricksWon}
                                    teamColor={teamColor}
                                />
                                <CardHand
                                    cards={isLocal ? playerData.hand : []}
                                    cardCount={
                                        isLocal
                                            ? playerData.hand.length
                                            : gameData.handsCounts[playerId] ??
                                              0
                                    }
                                    isLocalPlayer={isLocal}
                                    interactive={
                                        isLocal && isCurrentTurn && !isDealing
                                    }
                                    selectedIndex={
                                        isLocal ? selectedCardIndex : null
                                    }
                                    onCardClick={
                                        isLocal ? onCardSelect : undefined
                                    }
                                    playerId={playerId}
                                    isDealing={isDealing}
                                />
                            </EdgeRegion>
                        );
                    })}

                    {/* Center Area */}
                    <TableCenter className="flex flex-col items-center gap-4">
                        {/* Show deck when no cards dealt */}
                        {playerData.hand.length === 0 && !isDealing && (
                            <CardDeck cardCount={52} />
                        )}

                        {/* Round indicator */}
                        {playerData.hand.length > 0 && !isDealing && (
                            <>
                                <motion.div
                                    className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <span className="text-white/80 text-sm font-medium">
                                        Round {gameData.round} • Trick{" "}
                                        {(gameData.completedTricks?.length ||
                                            0) + 1}
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
                </GameTable>
            </LayoutGroup>

            {/* Game Scoreboard (Spades-specific UI) */}
            <GameScoreboard
                teams={teamScores}
                playerBids={playerBids}
                round={gameData.round}
                phase={gameData.phase}
                winTarget={gameData.settings?.winTarget}
            />

            {/* Play card confirmation bar */}
            <ActionConfirmationBar
                isVisible={
                    selectedCardIndex !== null && activePlayerIndex === 0
                }
                onConfirm={onPlayCard}
                onCancel={onCancelSelection}
                confirmLabel="Play Card"
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dominoes Debug Panel
// ─────────────────────────────────────────────────────────────────────────────

interface DominoesDebugPanelProps {
    gameData: DominoesData;
    playerData: DominoesPlayerData;
    activePlayerIndex: number;
    selectedTile: TileType | null;
    onTileSelect: (tile: TileType | null) => void;
    onPlaceTile: (side: "left" | "right") => void;
    showDebugGrid: boolean;
}

function DominoesDebugPanel({
    gameData,
    playerData,
    activePlayerIndex,
    selectedTile,
    onTileSelect,
    onPlaceTile,
    showDebugGrid,
}: DominoesDebugPanelProps) {
    const playerCount = playerData.localOrdering.length;

    // Check if selected tile can be placed on each side
    const canPlaceLeft = useMemo(() => {
        if (!selectedTile || gameData.board.tiles.length === 0)
            return selectedTile !== null;
        const leftEnd = gameData.board.leftEnd?.value;
        return (
            leftEnd !== undefined &&
            (selectedTile.left === leftEnd || selectedTile.right === leftEnd)
        );
    }, [selectedTile, gameData.board]);

    const canPlaceRight = useMemo(() => {
        if (!selectedTile || gameData.board.tiles.length === 0)
            return selectedTile !== null;
        const rightEnd = gameData.board.rightEnd?.value;
        return (
            rightEnd !== undefined &&
            (selectedTile.left === rightEnd || selectedTile.right === rightEnd)
        );
    }, [selectedTile, gameData.board]);

    // Can auto-place
    const canAutoPlace =
        selectedTile !== null &&
        (gameData.board.tiles.length === 0 ||
            (canPlaceLeft && !canPlaceRight) ||
            (canPlaceRight && !canPlaceLeft));

    const handleAutoPlace = () => {
        if (
            gameData.board.tiles.length === 0 ||
            (canPlaceLeft && !canPlaceRight)
        ) {
            onPlaceTile("left");
        } else if (canPlaceRight && !canPlaceLeft) {
            onPlaceTile("right");
        }
    };

    // Create customStats render function for dominoes
    const createDominoesStats = (playerId: string) => {
        const score = gameData.playerScores[playerId] ?? 0;
        const tilesCount = gameData.handsCounts[playerId] ?? 0;
        const winTarget = gameData.settings.winTarget;

        return () => (
            <div className="flex gap-1 items-center flex-wrap">
                <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-black/30 border-white/20 text-white/80"
                >
                    Score: {score}/{winTarget}
                </Badge>
                <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-black/30 border-white/20 text-white/80"
                >
                    Tiles: {tilesCount}
                </Badge>
            </div>
        );
    };

    return (
        <div className="h-screen w-full relative">
            <LayoutGroup>
                <GameTable
                    playerCount={playerCount}
                    isDealing={false}
                    showDebugGrid={showDebugGrid}
                    feltGradient="from-green-800 via-green-700 to-emerald-800"
                >
                    {/* Player Edge Regions */}
                    {playerData.localOrdering.map((playerId, index) => {
                        const isLocal = index === 0;
                        const player = gameData.players[playerId];
                        const isCurrentTurn = activePlayerIndex === index;
                        const edgePosition = getEdgePosition(
                            index,
                            playerCount
                        );

                        return (
                            <EdgeRegion
                                key={playerId}
                                position={edgePosition}
                                isHero={isLocal}
                            >
                                <PlayerInfo
                                    playerId={playerId}
                                    playerName={player?.name || "Unknown"}
                                    isCurrentTurn={isCurrentTurn}
                                    isLocalPlayer={isLocal}
                                    seatPosition={edgePosition}
                                    connected={player?.isConnected !== false}
                                    customStats={createDominoesStats(playerId)}
                                />

                                {/* Only show hand for local player */}
                                {isLocal && (
                                    <TileHand
                                        tiles={playerData.hand}
                                        board={gameData.board}
                                        selectedTile={selectedTile}
                                        isMyTurn={isCurrentTurn}
                                        onTileSelect={onTileSelect}
                                        showHints={true}
                                    />
                                )}
                            </EdgeRegion>
                        );
                    })}

                    {/* Center Area - Dominoes Board */}
                    <TableCenter className="flex flex-col items-center gap-4 w-full max-w-3xl">
                        {/* Round indicator */}
                        <div className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-1">
                            <span className="text-white/80 text-sm font-medium">
                                Round {gameData.round}
                            </span>
                        </div>

                        {/* Dominoes Board */}
                        <Board
                            board={gameData.board}
                            selectedTile={selectedTile}
                            isMyTurn={activePlayerIndex === 0}
                            canPlaceLeft={canPlaceLeft}
                            canPlaceRight={canPlaceRight}
                            onPlaceTile={onPlaceTile}
                            lastPlayedSide={null}
                            className="w-full"
                        />
                    </TableCenter>
                </GameTable>
            </LayoutGroup>

            {/* Action confirmation bar */}
            <ActionConfirmationBar
                isVisible={canAutoPlace}
                onConfirm={handleAutoPlace}
                onCancel={() => onTileSelect(null)}
                confirmLabel="Place Tile"
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Debug Page
// ─────────────────────────────────────────────────────────────────────────────

export default function GameUIDebugPage() {
    // Game selection
    const [selectedGame, setSelectedGame] = useState<GameType>("spades");
    const gameTypes = getRegisteredGameTypes() as GameType[];

    // Common state
    const [playerCount, setPlayerCount] = useState(4);
    const [activePlayerIndex, setActivePlayerIndex] = useState(0);
    const [showDebugGrid, setShowDebugGrid] = useState(false);
    const [isDealing, setIsDealing] = useState(false);

    // Spades-specific state
    const [spadesGameData, setSpadesGameData] = useState<SpadesData | null>(
        null
    );
    const [spadesPlayerData, setSpadesPlayerData] =
        useState<SpadesPlayerData | null>(null);
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
        null
    );

    // Dominoes-specific state
    const [dominoesGameData, setDominoesGameData] =
        useState<DominoesData | null>(null);
    const [dominoesPlayerData, setDominoesPlayerData] =
        useState<DominoesPlayerData | null>(null);
    const [selectedTile, setSelectedTile] = useState<TileType | null>(null);

    // Reset and regenerate mock data
    const handleReset = useCallback(() => {
        setActivePlayerIndex(0);
        setSelectedCardIndex(null);
        setSelectedTile(null);
        setIsDealing(false);

        const generator = getMockDataGenerator(selectedGame);
        if (generator) {
            const { gameData, playerData } = generator({ playerCount });
            if (selectedGame === "spades") {
                setSpadesGameData(gameData as SpadesData);
                setSpadesPlayerData(playerData as SpadesPlayerData);
            } else if (selectedGame === "dominoes") {
                setDominoesGameData(gameData as DominoesData);
                setDominoesPlayerData(playerData as DominoesPlayerData);
            }
        }
    }, [selectedGame, playerCount]);

    // Generate mock data on mount and game change
    useEffect(() => {
        handleReset();
    }, [selectedGame, playerCount, handleReset]);

    // Spades handlers
    const handleCardSelect = useCallback(
        (index: number, card: PlayingCardType) => {
            if (selectedCardIndex === index) {
                // Play the card
                if (spadesPlayerData && spadesGameData) {
                    const newHand = spadesPlayerData.hand.filter(
                        (_, i) => i !== index
                    );
                    const newTrick = {
                        plays: [
                            ...(spadesGameData.currentTrick?.plays || []),
                            {
                                playerId: spadesPlayerData.localOrdering[0],
                                card,
                            },
                        ],
                    };
                    setSpadesPlayerData({ ...spadesPlayerData, hand: newHand });
                    setSpadesGameData({
                        ...spadesGameData,
                        currentTrick: newTrick,
                    });
                    setSelectedCardIndex(null);
                    setActivePlayerIndex((prev) => (prev + 1) % playerCount);
                }
            } else {
                setSelectedCardIndex(index);
            }
        },
        [selectedCardIndex, spadesPlayerData, spadesGameData, playerCount]
    );

    const handlePlayCard = useCallback(() => {
        if (
            selectedCardIndex !== null &&
            spadesPlayerData?.hand[selectedCardIndex]
        ) {
            const card = spadesPlayerData.hand[selectedCardIndex];
            handleCardSelect(selectedCardIndex, card);
        }
    }, [selectedCardIndex, spadesPlayerData, handleCardSelect]);

    const handleCancelSelection = useCallback(() => {
        setSelectedCardIndex(null);
    }, []);

    const handleSimulateOpponentPlay = useCallback(() => {
        // Simulate opponent play by advancing turn
        setActivePlayerIndex((prev) => (prev + 1) % playerCount);
    }, [playerCount]);

    const handleClearTrick = useCallback(() => {
        if (spadesGameData) {
            setSpadesGameData({ ...spadesGameData, currentTrick: null });
        }
    }, [spadesGameData]);

    const handleDeal = useCallback(() => {
        setIsDealing(true);
        setTimeout(() => {
            handleReset();
            setIsDealing(false);
            toast.success("Cards dealt!");
        }, 1500);
    }, [handleReset]);

    // Dominoes handlers
    const handleTileSelect = useCallback((tile: TileType | null) => {
        setSelectedTile(tile);
    }, []);

    const handlePlaceTile = useCallback(
        (side: "left" | "right") => {
            if (!selectedTile || !dominoesGameData || !dominoesPlayerData)
                return;

            // Remove tile from hand
            const newHand = dominoesPlayerData.hand.filter(
                (t) => t.id !== selectedTile.id
            );

            // Add to board
            const newTiles = [...dominoesGameData.board.tiles];
            if (side === "left") {
                newTiles.unshift(selectedTile);
            } else {
                newTiles.push(selectedTile);
            }

            const newBoard = {
                tiles: newTiles,
                leftEnd: { value: newTiles[0].left, tileId: newTiles[0].id },
                rightEnd: {
                    value: newTiles[newTiles.length - 1].right,
                    tileId: newTiles[newTiles.length - 1].id,
                },
            };

            setDominoesPlayerData({ ...dominoesPlayerData, hand: newHand });
            setDominoesGameData({ ...dominoesGameData, board: newBoard });
            setSelectedTile(null);
            setActivePlayerIndex((prev) => (prev + 1) % playerCount);
            toast.success(`Tile placed on ${side}!`);
        },
        [selectedTile, dominoesGameData, dominoesPlayerData, playerCount]
    );

    const handlePass = useCallback(() => {
        setActivePlayerIndex((prev) => (prev + 1) % playerCount);
        toast.info("Passed turn");
    }, [playerCount]);

    return (
        <div className="flex flex-col min-h-screen bg-slate-900">
            {/* Control Panel */}
            <div className="flex-shrink-0 p-4 bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center">
                    {/* Game Selector */}
                    <Card className="flex-1 min-w-[200px] bg-slate-700 border-slate-600">
                        <CardHeader className="py-2 px-4">
                            <CardTitle className="text-sm text-white">
                                Game Type
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                            <Select
                                value={selectedGame}
                                onValueChange={(v: string) =>
                                    setSelectedGame(v as GameType)
                                }
                            >
                                <SelectTrigger className="w-full bg-slate-600 border-slate-500 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {gameTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {getGameDisplayName(type)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Player Count */}
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
                                    max={selectedGame === "spades" ? 4 : 6}
                                    step={selectedGame === "spades" ? 2 : 1}
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

                    {/* Active Player */}
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
                                    className="w-16 justify-center"
                                >
                                    {activePlayerIndex === 0
                                        ? "You"
                                        : `P${activePlayerIndex + 1}`}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-2">
                        {selectedGame === "spades" && (
                            <>
                                <Button
                                    onClick={handleDeal}
                                    disabled={isDealing}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {isDealing ? "Dealing..." : "Deal Cards"}
                                </Button>
                                <Button
                                    onClick={handleSimulateOpponentPlay}
                                    variant="outline"
                                >
                                    Simulate Play
                                </Button>
                                <Button
                                    onClick={handleClearTrick}
                                    variant="outline"
                                >
                                    Clear Trick
                                </Button>
                            </>
                        )}
                        {selectedGame === "dominoes" && (
                            <Button onClick={handlePass} variant="outline">
                                Pass Turn
                            </Button>
                        )}
                        <Button onClick={handleReset} variant="destructive">
                            Reset
                        </Button>
                    </div>

                    {/* Debug Grid Toggle */}
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

            {/* Game Panel */}
            <div className="flex-1">
                {selectedGame === "spades" &&
                    spadesGameData &&
                    spadesPlayerData && (
                        <SpadesDebugPanel
                            gameData={spadesGameData}
                            playerData={spadesPlayerData}
                            activePlayerIndex={activePlayerIndex}
                            selectedCardIndex={selectedCardIndex}
                            onCardSelect={handleCardSelect}
                            onPlayCard={handlePlayCard}
                            onCancelSelection={handleCancelSelection}
                            isDealing={isDealing}
                            showDebugGrid={showDebugGrid}
                        />
                    )}
                {selectedGame === "dominoes" &&
                    dominoesGameData &&
                    dominoesPlayerData && (
                        <DominoesDebugPanel
                            gameData={dominoesGameData}
                            playerData={dominoesPlayerData}
                            activePlayerIndex={activePlayerIndex}
                            selectedTile={selectedTile}
                            onTileSelect={handleTileSelect}
                            onPlaceTile={handlePlaceTile}
                            showDebugGrid={showDebugGrid}
                        />
                    )}
            </div>
        </div>
    );
}
