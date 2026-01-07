"use client";

import React, { useRef, ReactNode, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useContainerDimensions, ContainerDimensions } from "@/hooks";

// ─────────────────────────────────────────────────────────────────────────────
// Context for sharing table state with child components
// ─────────────────────────────────────────────────────────────────────────────

interface GameTableContextValue {
    dimensions: ContainerDimensions;
    playerCount: number;
    isDealing: boolean;
}

const GameTableContext = createContext<GameTableContextValue | null>(null);

export function useGameTable() {
    const context = useContext(GameTableContext);
    if (!context) {
        throw new Error("useGameTable must be used within a GameTable");
    }
    return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main GameTable Component
// ─────────────────────────────────────────────────────────────────────────────

interface GameTableProps {
    playerCount: number;
    children: ReactNode;
    isDealing?: boolean;
    className?: string;
    /** Custom gradient for the felt surface */
    feltGradient?: string;
    /** Show debug grid overlay */
    showDebugGrid?: boolean;
}

/**
 * GameTable - A CSS Grid-based responsive game table with edge-anchored player positioning.
 *
 * Uses CSS Grid to create a layout where:
 * - Players are positioned at the edges (top, bottom, left, right)
 * - The center region holds the card pile/trick area
 * - Cards are as close to screen edges as possible
 * - Player info is between cards and center
 *
 * Grid structure (4 players):
 *   .     top    .
 *   left  center right
 *   .     bottom .
 */
function GameTable({
    playerCount,
    children,
    isDealing = false,
    className,
    feltGradient = "from-emerald-800 via-emerald-700 to-teal-800",
    showDebugGrid = false,
}: GameTableProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dimensions = useContainerDimensions(containerRef);

    const contextValue: GameTableContextValue = {
        dimensions,
        playerCount,
        isDealing,
    };

    return (
        <GameTableContext.Provider value={contextValue}>
            <div
                ref={containerRef}
                className={cn(
                    "relative w-full h-full overflow-hidden",
                    `bg-gradient-to-br ${feltGradient}`,
                    className
                )}
            >
                {/* Felt texture overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%),
                            url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
                        `,
                    }}
                />

                {/* Subtle inner glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        boxShadow: "inset 0 0 100px rgba(0,0,0,0.3)",
                    }}
                />

                {/* Debug grid overlay */}
                {showDebugGrid && (
                    <DebugOverlay
                        dimensions={dimensions}
                        playerCount={playerCount}
                    />
                )}

                {/* Main CSS Grid content */}
                <div
                    className="relative z-10 w-full h-full grid"
                    style={{
                        gridTemplateAreas: `
                            ".     top    ."
                            "left  center right"
                            ".     bottom ."
                        `,
                        // Using minmax(0, auto) prevents content from blowing out grid items
                        // (auto alone acts as a minimum, causing overflow issues)
                        gridTemplateRows:
                            "minmax(0, auto) minmax(0, 1fr) minmax(0, auto)",
                        gridTemplateColumns:
                            "minmax(0, auto) minmax(0, 1fr) minmax(0, auto)",
                    }}
                >
                    {children}
                </div>
            </div>
        </GameTableContext.Provider>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Debug Overlay Component
// ─────────────────────────────────────────────────────────────────────────────

function DebugOverlay({
    dimensions,
    playerCount,
}: {
    dimensions: ContainerDimensions;
    playerCount: number;
}) {
    return (
        <div className="absolute inset-0 pointer-events-none z-50">
            {/* Center point */}
            <div
                className="absolute w-4 h-4 bg-yellow-400 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{
                    left: dimensions.centerX,
                    top: dimensions.centerY,
                }}
            />

            {/* Center crosshair */}
            <div
                className="absolute w-full h-0.5 bg-yellow-400/30"
                style={{ top: dimensions.centerY }}
            />
            <div
                className="absolute h-full w-0.5 bg-yellow-400/30"
                style={{ left: dimensions.centerX }}
            />

            {/* Grid visualization */}
            <div
                className="absolute inset-0 border-2 border-dashed border-yellow-400/30"
                style={{
                    display: "grid",
                    gridTemplateAreas: `
                        ".     top    ."
                        "left  center right"
                        ".     bottom ."
                    `,
                    gridTemplateRows: "auto 1fr auto",
                    gridTemplateColumns: "auto 1fr auto",
                }}
            >
                <div
                    className="border border-blue-400/50 bg-blue-400/10"
                    style={{ gridArea: "top" }}
                />
                <div
                    className="border border-green-400/50 bg-green-400/10"
                    style={{ gridArea: "left" }}
                />
                <div
                    className="border border-purple-400/50 bg-purple-400/10"
                    style={{ gridArea: "center" }}
                />
                <div
                    className="border border-green-400/50 bg-green-400/10"
                    style={{ gridArea: "right" }}
                />
                <div
                    className="border border-red-400/50 bg-red-400/10"
                    style={{ gridArea: "bottom" }}
                />
            </div>

            {/* Dimension info */}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded font-mono">
                <div>
                    Size: {Math.round(dimensions.width)} ×{" "}
                    {Math.round(dimensions.height)}
                </div>
                <div>
                    Orientation:{" "}
                    {dimensions.isPortrait ? "Portrait" : "Landscape"}
                </div>
                <div>Aspect: {dimensions.aspectRatio.toFixed(2)}</div>
                <div>Players: {playerCount}</div>
                <div className="mt-1 text-yellow-400">Grid Layout Active</div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Table Center Component
// ─────────────────────────────────────────────────────────────────────────────

interface TableCenterProps {
    children: ReactNode;
    className?: string;
    /** Minimum size of the center area */
    minSize?: number;
}

/**
 * TableCenter - The center region of the game table (CSS Grid area).
 * Use for trick piles, round indicators, and other central UI.
 */
export function TableCenter({
    children,
    className,
    minSize = 150,
}: TableCenterProps) {
    return (
        <motion.div
            className={cn(
                "flex flex-col items-center justify-center z-20",
                className
            )}
            style={{
                gridArea: "center",
                minWidth: minSize,
                minHeight: minSize,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {children}
        </motion.div>
    );
}

export default GameTable;
