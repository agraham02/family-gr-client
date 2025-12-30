"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "@/contexts/SessionContext";
import { DominoesData, DominoesPlayerData, Tile as TileType } from "@/types";
import { Button } from "@/components/ui/button";
import TileHand from "./ui/TileHand";
import Board from "./ui/Board";
import ScoreDisplay from "./ui/ScoreDisplay";
import RoundSummaryModal from "./ui/RoundSummaryModal";
import { cn } from "@/lib/utils";

interface DominoesProps {
    gameData: DominoesData;
    playerData: DominoesPlayerData;
}

/**
 * Check if a tile can be placed on a specific side of the board
 */
function canPlaceTileOnSide(
    tile: TileType,
    board: DominoesData["board"],
    side: "left" | "right"
): boolean {
    if (board.tiles.length === 0) {
        return true;
    }

    const end = side === "left" ? board.leftEnd : board.rightEnd;
    if (!end) return false;

    return tile.left === end.value || tile.right === end.value;
}

/**
 * Check if player has any legal move
 */
function hasLegalMove(
    tiles: TileType[],
    board: DominoesData["board"]
): boolean {
    if (board.tiles.length === 0) return tiles.length > 0;

    return tiles.some(
        (tile) =>
            canPlaceTileOnSide(tile, board, "left") ||
            canPlaceTileOnSide(tile, board, "right")
    );
}

export default function Dominoes({ gameData, playerData }: DominoesProps) {
    const { socket, connected } = useWebSocket();
    const { roomId, userId } = useSession();

    const [selectedTile, setSelectedTile] = useState<TileType | null>(null);
    const [lastPlayedSide, setLastPlayedSide] = useState<
        "left" | "right" | null
    >(null);

    const sendGameAction = useCallback(
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

    // Derived state
    const currentPlayerId = gameData.playOrder[gameData.currentTurnIndex];
    const isMyTurn = currentPlayerId === userId;
    const isPlaying = gameData.phase === "playing";
    const hand = playerData.hand || [];
    const localOrdering = playerData.localOrdering || gameData.playOrder;

    // Calculate if selected tile can be placed on each side
    const canPlaceLeft = useMemo(
        () =>
            selectedTile !== null &&
            canPlaceTileOnSide(selectedTile, gameData.board, "left"),
        [selectedTile, gameData.board]
    );

    const canPlaceRight = useMemo(
        () =>
            selectedTile !== null &&
            canPlaceTileOnSide(selectedTile, gameData.board, "right"),
        [selectedTile, gameData.board]
    );

    // Check if player must pass
    const mustPass = useMemo(
        () => isMyTurn && isPlaying && !hasLegalMove(hand, gameData.board),
        [isMyTurn, isPlaying, hand, gameData.board]
    );

    // Handle tile selection
    function handleTileSelect(tile: TileType | null) {
        if (!isMyTurn || !isPlaying) return;
        setSelectedTile(tile);
    }

    // Handle placing a tile
    function handlePlaceTile(side: "left" | "right") {
        if (!selectedTile || !isMyTurn || !isPlaying) return;

        sendGameAction("PLACE_TILE", {
            tile: selectedTile,
            side,
        });

        setSelectedTile(null);
        setLastPlayedSide(side);
    }

    // Handle pass
    function handlePass() {
        if (!isMyTurn || !isPlaying || !mustPass) return;
        sendGameAction("PASS", {});
    }

    // Auto-place if only one side is valid
    function handleAutoPlace() {
        if (!selectedTile) return;

        const canLeft = canPlaceTileOnSide(
            selectedTile,
            gameData.board,
            "left"
        );
        const canRight = canPlaceTileOnSide(
            selectedTile,
            gameData.board,
            "right"
        );

        // If board is empty or only one side works, auto-place
        if (gameData.board.tiles.length === 0) {
            handlePlaceTile("left"); // Default to left for first tile
        } else if (canLeft && !canRight) {
            handlePlaceTile("left");
        } else if (canRight && !canLeft) {
            handlePlaceTile("right");
        }
        // If both sides work, buttons on board will handle it
    }

    return (
        <div className="h-full w-full flex flex-col">
            {/* Main game area */}
            <div className="flex-1 flex flex-col p-4 gap-4 max-w-6xl mx-auto w-full">
                {/* Round indicator */}
                <div className="text-center">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Round {gameData.round}
                    </span>
                </div>

                {/* Score display */}
                <ScoreDisplay
                    players={gameData.players}
                    playerScores={gameData.playerScores}
                    playOrder={gameData.playOrder}
                    currentTurnIndex={gameData.currentTurnIndex}
                    handsCounts={gameData.handsCounts}
                    winTarget={gameData.settings.winTarget}
                    localOrdering={localOrdering}
                    currentUserId={userId || ""}
                />

                {/* Board */}
                <Board
                    board={gameData.board}
                    selectedTile={selectedTile}
                    isMyTurn={isMyTurn && isPlaying}
                    canPlaceLeft={canPlaceLeft}
                    canPlaceRight={canPlaceRight}
                    onPlaceTile={handlePlaceTile}
                    lastPlayedSide={lastPlayedSide}
                    className="flex-1"
                />

                {/* Turn indicator */}
                <div
                    className={cn(
                        "text-center py-2 rounded-lg transition-colors",
                        isMyTurn && isPlaying
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    )}
                >
                    {isPlaying ? (
                        isMyTurn ? (
                            <span className="font-semibold">Your turn!</span>
                        ) : (
                            <span>
                                Waiting for{" "}
                                <span className="font-medium">
                                    {gameData.players[currentPlayerId]?.name ||
                                        "..."}
                                </span>
                            </span>
                        )
                    ) : (
                        <span>Game paused</span>
                    )}
                </div>

                {/* Player's hand */}
                <TileHand
                    tiles={hand}
                    board={gameData.board}
                    selectedTile={selectedTile}
                    isMyTurn={isMyTurn && isPlaying}
                    onTileSelect={handleTileSelect}
                />

                {/* Action buttons */}
                <div className="flex gap-4 justify-center">
                    {/* Pass button */}
                    {isMyTurn && isPlaying && mustPass && (
                        <Button
                            variant="destructive"
                            onClick={handlePass}
                            className="px-8 py-3 text-lg font-semibold shadow-md"
                        >
                            Pass (No Moves)
                        </Button>
                    )}

                    {/* Quick place button when tile selected and only one option */}
                    {selectedTile &&
                        isMyTurn &&
                        isPlaying &&
                        (gameData.board.tiles.length === 0 ||
                            (canPlaceLeft && !canPlaceRight) ||
                            (canPlaceRight && !canPlaceLeft)) && (
                            <Button
                                onClick={handleAutoPlace}
                                className="px-8 py-3 text-lg font-semibold bg-green-600 hover:bg-green-700 shadow-md"
                            >
                                Place Tile
                            </Button>
                        )}

                    {/* Cancel selection button */}
                    {selectedTile && (
                        <Button
                            variant="outline"
                            onClick={() => setSelectedTile(null)}
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            {/* Round Summary Modal */}
            <RoundSummaryModal
                gameData={gameData}
                sendGameAction={sendGameAction}
            />
        </div>
    );
}
