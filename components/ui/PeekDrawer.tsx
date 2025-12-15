"use client";

import { useState } from "react";
import { CardWithZoom } from "@/components/cards";
import type { CardInstance } from "@/lib/types";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface PeekDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: CardInstance[];
  deckLabel: string;
  onPeekCountChange?: (count: number) => void;
}

export function PeekDrawer({
  open,
  onOpenChange,
  cards,
  deckLabel,
  onPeekCountChange,
}: PeekDrawerProps) {
  const [peekCount, setPeekCount] = useState(1);
  const maxPeek = Math.min(3, cards.length);

  // Get the top N cards from the deck (highest position = top)
  const getTopCards = (n: number): CardInstance[] => {
    const sorted = [...cards].sort((a, b) => b.position - a.position);
    return sorted.slice(0, n);
  };

  const peekedCards = getTopCards(peekCount);

  const handlePeekCountChange = (newCount: number) => {
    setPeekCount(newCount);
    onPeekCountChange?.(newCount);
  };

  // Reset peek count when drawer closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPeekCount(1);
    }
    onOpenChange(newOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="bg-board-bg border-board-border max-h-[85vh]">
        <div className="mx-auto w-full max-w-4xl">
          <DrawerHeader className="border-b border-board-border">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-gold">
                Peeking {deckLabel}
              </DrawerTitle>
              {maxPeek > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gold/70">Show:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => handlePeekCountChange(n)}
                        disabled={n > cards.length}
                        className={`
                          w-8 h-8 rounded-full text-sm font-bold transition-colors
                          ${peekCount === n
                            ? "bg-gold text-board-bg"
                            : n > cards.length
                              ? "bg-board-zone text-gold/30 cursor-not-allowed"
                              : "bg-board-zone text-gold hover:bg-gold/20"
                          }
                        `}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DrawerHeader>

          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {peekedCards.length === 0 ? (
              <div className="text-center text-gold/30 py-8">No cards to peek</div>
            ) : (
              <div className="flex justify-center gap-4 flex-wrap">
                {peekedCards.map((cardInstance, index) => (
                  <PeekCard
                    key={cardInstance.cardInstanceId}
                    cardInstance={cardInstance}
                    position={index + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Individual card in peek drawer
function PeekCard({
  cardInstance,
  position,
}: {
  cardInstance: CardInstance;
  position: number;
}) {
  if (!cardInstance.card) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-gold/50">#{position}</span>
      <div
        className="relative w-[120px]"
        style={{ aspectRatio: "5/7" }}
      >
        <CardWithZoom card={cardInstance.card} isFaceUp={true}>
          <div className="w-full h-full rounded-lg overflow-hidden border-2 border-gold/30">
            {cardInstance.card.imageUrl ? (
              <img
                src={cardInstance.card.imageUrl}
                alt={cardInstance.card.cardName}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-board-zone flex items-center justify-center">
                <span className="text-xs text-gold/30">{cardInstance.card.cardName}</span>
              </div>
            )}
          </div>
        </CardWithZoom>
      </div>
      <span className="text-xs text-gray-400 max-w-[120px] truncate">
        {cardInstance.card.cardName}
      </span>
    </div>
  );
}
