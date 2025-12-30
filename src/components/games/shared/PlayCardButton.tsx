"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";

interface PlayCardButtonProps {
    visible: boolean;
    onPlay: () => void;
    onCancel: () => void;
    disabled?: boolean;
    className?: string;
}

function PlayCardButton({
    visible,
    onPlay,
    onCancel,
    disabled = false,
    className,
}: PlayCardButtonProps) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className={cn(
                        "fixed bottom-32 left-1/2 -translate-x-1/2 z-50",
                        "flex items-center gap-2",
                        className
                    )}
                    initial={{ y: 20, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.9 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                    }}
                >
                    {/* Cancel button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onCancel}
                        className="h-12 w-12 rounded-full border-white/20 bg-slate-800/90 hover:bg-slate-700 text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    {/* Play button */}
                    <Button
                        size="lg"
                        onClick={onPlay}
                        disabled={disabled}
                        className={cn(
                            "h-14 px-8 rounded-full",
                            "bg-gradient-to-r from-emerald-500 to-teal-600",
                            "hover:from-emerald-600 hover:to-teal-700",
                            "text-white font-semibold text-lg",
                            "shadow-lg shadow-emerald-500/30",
                            "transition-all duration-200"
                        )}
                    >
                        <Play className="w-5 h-5 mr-2" />
                        Play Card
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default PlayCardButton;
