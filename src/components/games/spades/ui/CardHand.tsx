import React from "react";
import Card from "./Card";
import { cn } from "@/lib/utils";
import { PlayingCard } from "@/types";

// Responsive card overlap styles
// Uses clamp() to scale overlap based on viewport width
const CARD_OVERLAP_STYLES = {
    horizontal: {
        // For side players: overlap vertically
        marginTop: "clamp(-1rem, -2vw, -2rem)",
        marginLeft: "clamp(-1rem, -2vw, -2rem)",
    },
    vertical: {
        // For top/bottom players: overlap horizontally
        marginLeft: "clamp(-1rem, -3vw, -2rem)",
        marginBottom: "clamp(-1.5rem, -4vw, -3rem)",
    },
};

export default function CardHand({
    playerName,
    isCurrentPlayer,
    cards,
    isLocalPlayer,
    isSide = false,
    cardCount,
    handleCardPlay,
}: {
    playerName: string;
    isCurrentPlayer?: boolean;
    cards: PlayingCard[];
    cardCount?: number;
    isLocalPlayer: boolean;
    isSide?: boolean;
    handleCardPlay?: (card: { suit: string; rank: string }) => void;
}) {
    // If not local player and no cards array, render card backs/count only
    const shouldShowCardBacks =
        !isLocalPlayer && (!cards || cards.length === 0) && cardCount;

    const overlapStyle = isSide
        ? CARD_OVERLAP_STYLES.horizontal
        : CARD_OVERLAP_STYLES.vertical;

    return (
        <div>
            <div
                className={cn(
                    "z-50 text-center",
                    isCurrentPlayer ? "font-bold text-amber-500" : ""
                )}
            >
                {playerName}
            </div>
            <div
                className={cn(
                    "flex justify-center w-fit",
                    isSide
                        ? "flex-col-reverse flex-wrap-reverse h-full"
                        : "flex-row flex-wrap px-5",
                    isSide ? "pt-8 pl-8" : "pl-12 pb-12 "
                )}
            >
                {shouldShowCardBacks
                    ? Array(cardCount)
                          .fill(0)
                          .map((_, index) => (
                              <Card
                                  key={index}
                                  card={null}
                                  index={index}
                                  hidden={true}
                                  size={"sm"}
                                  orientation={
                                      isSide ? "horizontal" : "vertical"
                                  }
                                  style={overlapStyle}
                                  asInteractive={false}
                              />
                          ))
                    : cards.map((card, index) => (
                          <Card
                              key={`${card.suit}-${card.rank}-${index}`}
                              card={card}
                              index={index}
                              hidden={!isLocalPlayer}
                              size={isLocalPlayer ? "md" : "sm"}
                              orientation={isSide ? "horizontal" : "vertical"}
                              className="border-1"
                              style={overlapStyle}
                              asInteractive={isLocalPlayer}
                              onClick={
                                  isLocalPlayer && handleCardPlay
                                      ? () => handleCardPlay(card)
                                      : undefined
                              }
                          />
                      ))}
            </div>
        </div>
    );
}
