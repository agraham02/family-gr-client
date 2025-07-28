import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
            <DialogContent className="flex flex-col items-center gap-4 max-w-xs">
                <DialogTitle>
                    <div className="text-lg font-semibold mb-2">Your Bid</div>
                </DialogTitle>
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
                <Button
                    className="mt-4 w-full"
                    onClick={() => {
                        handleSubmitBid();
                        setBidModalOpen(false);
                    }}
                >
                    Submit Bid
                </Button>
                <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setBidModalOpen(false)}
                >
                    Hide
                </Button>
            </DialogContent>
        </Dialog>
    );
}
