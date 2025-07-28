// components/CardPile.tsx
import { PlayingCard } from "@/types";
import Card from "./Card";
import { AnimatePresence, motion } from "motion/react";

export default function CardPile({
    cards,
    winningCard,
}: {
    cards: PlayingCard[] | undefined;
    winningCard?: PlayingCard;
}) {
    if (!cards || cards.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center justify-center flex-wrap">
            <AnimatePresence initial={false}>
                {cards.map((card, index) => {
                    const isWinning =
                        winningCard &&
                        card.rank === winningCard.rank &&
                        card.suit === winningCard.suit;
                    return (
                        <motion.div
                            className={
                                "m-1" +
                                (isWinning
                                    ? " ring-4 ring-yellow-400 rounded-sm"
                                    : "")
                            }
                            key={`${card.rank}-${card.suit}-${index}`}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <Card card={card} />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
