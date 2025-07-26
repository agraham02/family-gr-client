import React from "react";
import Card from "./Card";
import { cn } from "@/lib/utils";
import { PlayingCard } from "@/types";
import { AnimatePresence, motion } from "motion/react";

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
                    "flex justify-center border-4 border-red-700 w-fit",
                    isSide
                        ? "flex-col-reverse flex-wrap-reverse h-full"
                        : "flex-row flex-wrap px-5",
                    isSide ? "pt-8 pl-8" : "pl-12 pb-12 "
                )}
            >
                <AnimatePresence initial={false}>
                    {shouldShowCardBacks
                        ? Array(cardCount)
                              .fill(0)
                              .map((_, index) => (
                                  <motion.div
                                      key={index}
                                      initial={{ x: 0, opacity: 1 }}
                                      exit={{
                                          x: isSide ? -50 : 0,
                                          y: isSide ? 0 : 50,
                                          opacity: 0,
                                      }}
                                      transition={{ duration: 0.4 }}
                                  >
                                      <Card
                                          card={null}
                                          index={index}
                                          hidden={true}
                                          size={"sm"}
                                          orientation={
                                              isSide ? "horizontal" : "vertical"
                                          }
                                          className={cn(
                                              "border-2 border-red-500",
                                              isSide
                                                  ? "mt-[-2rem] ml-[-2rem]"
                                                  : "ml-[-2rem] mb-[-3rem]"
                                          )}
                                          asInteractive={false}
                                      />
                                  </motion.div>
                              ))
                        : cards.map((card, index) => (
                              <motion.div
                                  key={card.suit + card.rank + index}
                                  initial={{ x: 0, opacity: 1 }}
                                  exit={{
                                      x: isSide ? -50 : 0,
                                      y: isSide ? 0 : 50,
                                      opacity: 0,
                                  }}
                                  transition={{ duration: 0.4 }}
                              >
                                  <Card
                                      card={card}
                                      index={index}
                                      hidden={!isLocalPlayer}
                                      size={isLocalPlayer ? "md" : "sm"}
                                      orientation={
                                          isSide ? "horizontal" : "vertical"
                                      }
                                      className={cn(
                                          "border-2 border-red-500",
                                          isSide
                                              ? "mt-[-2rem] ml-[-2rem]"
                                              : "ml-[-2rem] mb-[-3rem]"
                                      )}
                                      asInteractive={isLocalPlayer}
                                      onClick={
                                          isLocalPlayer && handleCardPlay
                                              ? () => handleCardPlay(card)
                                              : undefined
                                      }
                                  />
                              </motion.div>
                          ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
