import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { motion } from "motion/react";
import { Minus, Plus, Target } from "lucide-react";
import React from "react";

export default function PlaceBidModal({
    bid,
    bidModalOpen,
    setBidModalOpen,
    handleBidChange,
    handleSubmitBid,
}: {
    bid: number;
    bidModalOpen: boolean;
    setBidModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleBidChange: (delta: number) => void;
    handleSubmitBid: () => void;
}) {
    return (
        <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
            <DialogContent className="flex flex-col items-center gap-6 max-w-sm bg-slate-900 border-white/10 text-white p-6">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                    <Target className="w-6 h-6 text-amber-400" />
                    Place Your Bid
                </DialogTitle>

                <p className="text-sm text-white/60 text-center -mt-2">
                    How many tricks do you think you can win?
                </p>

                <div className="flex items-center gap-6">
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleBidChange(-1)}
                        disabled={bid <= 0}
                        aria-label="Decrease bid"
                        className="h-14 w-14 rounded-full border-white/20 bg-slate-800 hover:bg-slate-700 text-white text-2xl disabled:opacity-30"
                    >
                        <Minus className="w-6 h-6" />
                    </Button>

                    <motion.div
                        key={bid}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg"
                    >
                        <span className="text-4xl font-bold text-white">
                            {bid}
                        </span>
                    </motion.div>

                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleBidChange(1)}
                        disabled={bid >= 13}
                        aria-label="Increase bid"
                        className="h-14 w-14 rounded-full border-white/20 bg-slate-800 hover:bg-slate-700 text-white text-2xl disabled:opacity-30"
                    >
                        <Plus className="w-6 h-6" />
                    </Button>
                </div>

                {/* Quick bid buttons */}
                <div className="flex-col justify-center items-center text-white/70 space-y-2">
                    <p className="text-center">Quick Bid</p>

                    <div className="flex gap-2 flex-wrap justify-center">
                        {[0, 1, 2, 3, 4, 5, 6].map((quickBid) => (
                            <Button
                                key={quickBid}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBidChange(quickBid - bid)}
                                className={`h-8 w-8 rounded-full ${
                                    bid === quickBid
                                        ? "bg-amber-500/30 text-amber-400"
                                        : "text-white/60 hover:text-white hover:bg-white/10"
                                }`}
                            >
                                {quickBid}
                            </Button>
                        ))}
                    </div>
                </div>

                <Button
                    className="mt-2 w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                    onClick={() => {
                        handleSubmitBid();
                        setBidModalOpen(false);
                    }}
                >
                    Submit Bid
                </Button>

                <Button
                    variant="ghost"
                    className="w-full text-white/60 hover:text-white hover:bg-white/10"
                    onClick={() => setBidModalOpen(false)}
                >
                    Hide
                </Button>
            </DialogContent>
        </Dialog>
    );
}
