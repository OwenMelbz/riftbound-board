"use client";

import type { Card } from "@/lib/types";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface CardDetailDrawerProps {
  card: Card | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardDetailDrawer({ card, open, onOpenChange }: CardDetailDrawerProps) {
  if (!card) return null;

  const isBattlefield = card.cardType === "Battlefield";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-board-bg border-board-border max-h-[85vh]">
        <div className="mx-auto w-full max-w-4xl">
          <DrawerHeader className="border-b border-board-border">
            <DrawerTitle className="text-gold">{card.cardName}</DrawerTitle>
            <DrawerDescription className="text-gold/70">{card.cardType}</DrawerDescription>
          </DrawerHeader>

          <div className="p-4 flex flex-col md:flex-row gap-6 overflow-y-auto">
            {/* Card Image */}
            <div className="flex-shrink-0 flex justify-center">
              {card.imageUrl ? (
                isBattlefield ? (
                  // Battlefield cards are landscape - display rotated in portrait container
                  <div className="relative w-[200px] h-[280px] rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={card.imageUrl}
                      alt={card.cardName}
                      className="rotate-90"
                      style={{
                        height: "200px",
                        width: "auto",
                        minWidth: "280px",
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={card.imageUrl}
                    alt={card.cardName}
                    className="w-[200px] h-[280px] rounded-lg object-cover"
                    draggable={false}
                  />
                )
              ) : (
                <div className="w-[200px] h-[280px] rounded-lg bg-board-zone border border-board-border flex items-center justify-center">
                  <span className="text-gold/30">No image</span>
                </div>
              )}
            </div>

            {/* Card Details */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {card.energy !== null && (
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                      {card.energy}
                    </span>
                    <span className="text-gray-400">Energy</span>
                  </div>
                )}
                {card.might !== null && (
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold">
                      {card.might}
                    </span>
                    <span className="text-gray-400">Might</span>
                  </div>
                )}
                {card.domain && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Domain:</span>
                    <span className="font-semibold text-gold">{card.domain}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Rarity:</span>
                  <span className="font-semibold">{card.rarity}</span>
                </div>
              </div>

              {card.tags.length > 0 && (
                <div className="mb-4">
                  <span className="text-gray-400 text-sm">Tags: </span>
                  <span className="text-sm">{card.tags.join(", ")}</span>
                </div>
              )}

              {card.ability && (
                <div className="flex-1 bg-board-zone rounded-lg p-3 overflow-y-auto max-h-[200px]">
                  <p className="text-sm whitespace-pre-wrap">{card.ability}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-board-border text-xs text-gray-500">
                <p>
                  {card.setName} &bull; {card.cardNumber}
                </p>
                {card.artist && <p>Art by {card.artist}</p>}
              </div>
            </div>
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  );
}
