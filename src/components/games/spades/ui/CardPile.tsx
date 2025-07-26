// components/CardPile.tsx
import { PlayingCard } from "@/types";
import Card from "./Card";
import { AnimatePresence, motion } from "motion/react";

export default function CardPile({
    cards,
}: {
    cards: PlayingCard[] | undefined;
}) {
    if (!cards || cards.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center justify-center flex-wrap">
            <AnimatePresence initial={false}>
                {cards.map((card, index) => (
                    <motion.div
                        className="m-1"
                        key={`${card.rank}-${card.suit}-${index}`}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Card card={card} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
