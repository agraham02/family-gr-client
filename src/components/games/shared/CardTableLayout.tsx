"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FanPosition } from "./CardFan";
import { SeatPosition } from "./PlayerSeat";

// Seat configuration for a player
interface SeatConfig {
    position: SeatPosition;
    fanPosition: FanPosition;
    gridArea: string;
    style: React.CSSProperties;
}

// Context for sharing layout information
interface CardTableContextValue {
    playerCount: number;
    getSeatConfig: (localIndex: number) => SeatConfig;
}

const CardTableContext = createContext<CardTableContextValue | null>(null);

export function useCardTable() {
    const context = useContext(CardTableContext);
    if (!context) {
        throw new Error("useCardTable must be used within a CardTableLayout");
    }
    return context;
}

// Predefined layouts for different player counts
// Index 0 is always the local player (bottom center)
const LAYOUTS: Record<number, SeatConfig[]> = {
    2: [
        {
            position: "bottom",
            fanPosition: "bottom",
            gridArea: "bottom",
            style: {},
        },
        { position: "top", fanPosition: "top", gridArea: "top", style: {} },
    ],
    3: [
        {
            position: "bottom",
            fanPosition: "bottom",
            gridArea: "bottom",
            style: {},
        },
        { position: "left", fanPosition: "left", gridArea: "left", style: {} },
        {
            position: "right",
            fanPosition: "right",
            gridArea: "right",
            style: {},
        },
    ],
    4: [
        {
            position: "bottom",
            fanPosition: "bottom",
            gridArea: "bottom",
            style: {},
        },
        { position: "left", fanPosition: "left", gridArea: "left", style: {} },
        { position: "top", fanPosition: "top", gridArea: "top", style: {} },
        {
            position: "right",
            fanPosition: "right",
            gridArea: "right",
            style: {},
        },
    ],
    5: [
        {
            position: "bottom",
            fanPosition: "bottom",
            gridArea: "bottom",
            style: {},
        },
        {
            position: "bottom-left",
            fanPosition: "left",
            gridArea: "bottom-left",
            style: {},
        },
        {
            position: "top-left",
            fanPosition: "left",
            gridArea: "top-left",
            style: {},
        },
        {
            position: "top-right",
            fanPosition: "right",
            gridArea: "top-right",
            style: {},
        },
        {
            position: "bottom-right",
            fanPosition: "right",
            gridArea: "bottom-right",
            style: {},
        },
    ],
    6: [
        {
            position: "bottom",
            fanPosition: "bottom",
            gridArea: "bottom",
            style: {},
        },
        {
            position: "bottom-left",
            fanPosition: "left",
            gridArea: "bottom-left",
            style: {},
        },
        {
            position: "top-left",
            fanPosition: "left",
            gridArea: "top-left",
            style: {},
        },
        { position: "top", fanPosition: "top", gridArea: "top", style: {} },
        {
            position: "top-right",
            fanPosition: "right",
            gridArea: "top-right",
            style: {},
        },
        {
            position: "bottom-right",
            fanPosition: "right",
            gridArea: "bottom-right",
            style: {},
        },
    ],
    7: [
        {
            position: "bottom",
            fanPosition: "bottom",
            gridArea: "bottom",
            style: {},
        },
        {
            position: "bottom-left",
            fanPosition: "left",
            gridArea: "bottom-left",
            style: {},
        },
        { position: "left", fanPosition: "left", gridArea: "left", style: {} },
        {
            position: "top-left",
            fanPosition: "top",
            gridArea: "top-left",
            style: {},
        },
        {
            position: "top-right",
            fanPosition: "top",
            gridArea: "top-right",
            style: {},
        },
        {
            position: "right",
            fanPosition: "right",
            gridArea: "right",
            style: {},
        },
        {
            position: "bottom-right",
            fanPosition: "right",
            gridArea: "bottom-right",
            style: {},
        },
    ],
    8: [
        {
            position: "bottom",
            fanPosition: "bottom",
            gridArea: "bottom",
            style: {},
        },
        {
            position: "bottom-left",
            fanPosition: "left",
            gridArea: "bottom-left",
            style: {},
        },
        { position: "left", fanPosition: "left", gridArea: "left", style: {} },
        {
            position: "top-left",
            fanPosition: "top",
            gridArea: "top-left",
            style: {},
        },
        { position: "top", fanPosition: "top", gridArea: "top", style: {} },
        {
            position: "top-right",
            fanPosition: "top",
            gridArea: "top-right",
            style: {},
        },
        {
            position: "right",
            fanPosition: "right",
            gridArea: "right",
            style: {},
        },
        {
            position: "bottom-right",
            fanPosition: "right",
            gridArea: "bottom-right",
            style: {},
        },
    ],
};

interface CardTableLayoutProps {
    playerCount: number;
    children: ReactNode;
    className?: string;
}

function CardTableLayout({
    playerCount,
    children,
    className,
}: CardTableLayoutProps) {
    const clampedCount = Math.max(2, Math.min(8, playerCount));
    const layout = LAYOUTS[clampedCount];

    const getSeatConfig = (localIndex: number): SeatConfig => {
        return layout[localIndex] || layout[0];
    };

    const contextValue: CardTableContextValue = {
        playerCount: clampedCount,
        getSeatConfig,
    };

    // Grid areas for different layouts
    const gridTemplateAreas = getGridTemplateAreas(clampedCount);

    return (
        <CardTableContext.Provider value={contextValue}>
            <div
                className={cn(
                    "relative w-full h-full overflow-hidden",
                    "grid",
                    className
                )}
                style={{
                    gridTemplateAreas,
                    gridTemplateRows:
                        "minmax(80px, auto) 1fr minmax(100px, auto)",
                    gridTemplateColumns:
                        "minmax(120px, auto) 1fr minmax(120px, auto)",
                }}
            >
                {children}
            </div>
        </CardTableContext.Provider>
    );
}

// Generate grid template areas based on player count
function getGridTemplateAreas(playerCount: number): string {
    switch (playerCount) {
        case 2:
            return `
                ". top ."
                ". center ."
                ". bottom ."
            `;
        case 3:
            return `
                ". . ."
                "left center right"
                ". bottom ."
            `;
        case 4:
            return `
                ". top ."
                "left center right"
                ". bottom ."
            `;
        case 5:
            return `
                "top-left . top-right"
                ". center ."
                "bottom-left bottom bottom-right"
            `;
        case 6:
            return `
                "top-left top top-right"
                ". center ."
                "bottom-left bottom bottom-right"
            `;
        case 7:
        case 8:
        default:
            return `
                "top-left top top-right"
                "left center right"
                "bottom-left bottom bottom-right"
            `;
    }
}

// Export the seat component wrapper that positions children based on seat
interface TableSeatProps {
    index: number;
    children: ReactNode;
    className?: string;
}

export function TableSeat({ index, children, className }: TableSeatProps) {
    const { getSeatConfig } = useCardTable();
    const config = getSeatConfig(index);

    // Get position-specific styles
    const positionStyles = getPositionStyles(config.position);

    return (
        <div
            className={cn(
                "flex overflow-visible",
                positionStyles.className,
                className
            )}
            style={{ gridArea: config.gridArea }}
        >
            {children}
        </div>
    );
}

function getPositionStyles(position: SeatPosition): { className: string } {
    switch (position) {
        case "bottom":
            // Cards at bottom of screen, stack vertically, content at end
            return { className: "flex-col items-center justify-end p-2" };
        case "top":
            // Cards at top of screen, stack vertically, content at start
            return { className: "flex-col items-center justify-start p-2" };
        case "left":
        case "bottom-left":
        case "top-left":
            // Cards at left edge, stack horizontally, content at start
            return { className: "flex-row items-center justify-start p-2" };
        case "right":
        case "bottom-right":
        case "top-right":
            // Cards at right edge, stack horizontally, content at end
            return { className: "flex-row items-center justify-end p-2" };
        default:
            return { className: "flex-col items-center justify-center" };
    }
}

// Center area for trick pile
export function TableCenter({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn("flex items-center justify-center", className)}
            style={{ gridArea: "center" }}
        >
            {children}
        </div>
    );
}

export default CardTableLayout;
