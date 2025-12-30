"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for the game page
 * Shows a loading state while game data is being fetched
 */
export function GameSkeleton() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
            {/* Game table area */}
            <div className="relative w-full max-w-4xl aspect-square">
                {/* Center area (card table) */}
                <Skeleton className="absolute inset-[20%] rounded-full" />

                {/* Player positions */}
                {/* Top */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                </div>
                {/* Right */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                </div>
                {/* Bottom */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                </div>
                {/* Left */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>

            {/* Hand area */}
            <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="h-24 w-16 rounded-lg"
                        style={{
                            transform: `rotate(${(i - 3) * 5}deg)`,
                        }}
                    />
                ))}
            </div>

            {/* Game info sidebar */}
            <div className="fixed top-4 right-4 w-64 space-y-3">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
            </div>
        </main>
    );
}

/**
 * Skeleton loader for the lobby page
 * Shows a loading state while lobby data is being fetched
 */
export function LobbySkeleton() {
    return (
        <main className="px-4 py-8 flex flex-col items-center">
            {/* Header */}
            <header className="text-center mb-8">
                <Skeleton className="h-9 w-48 mx-auto mb-2" />
                <div className="flex items-center justify-center gap-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
            </header>

            {/* Dashboard grid */}
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Player List Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-4 space-y-3">
                    <Skeleton className="h-6 w-24 mb-4" />
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                    ))}
                </div>

                {/* Available Games Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-4 space-y-3">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className="h-16 w-full rounded-lg"
                            />
                        ))}
                    </div>
                </div>

                {/* Room Controls Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-4 space-y-3">
                    <Skeleton className="h-6 w-28 mb-4" />
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
            </div>
        </main>
    );
}
