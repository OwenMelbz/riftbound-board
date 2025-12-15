"use client";

import { useEffect } from "react";
import type { Card } from "@/lib/types";

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
}

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!card) return null;

  const isBattlefield = card.cardType === "Battlefield";

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-board-zone rounded-lg p-6 max-w-2xl w-full mx-4 flex gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card Image */}
        <div className="flex-shrink-0">
          {card.imageUrl ? (
            isBattlefield ? (
              // Battlefield cards are landscape - display rotated in portrait container
              <div className="relative w-[240px] h-[336px] rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={card.imageUrl}
                  alt={card.cardName}
                  className="rotate-90"
                  style={{
                    height: "240px",
                    width: "auto",
                    minWidth: "336px",
                  }}
                />
              </div>
            ) : (
              <img
                src={card.imageUrl}
                alt={card.cardName}
                className="w-[240px] h-[336px] rounded-lg object-cover"
                draggable={false}
              />
            )
          ) : (
            <div className="w-[240px] h-[336px] rounded-lg bg-board-bg border border-board-border flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
        </div>

        {/* Card Details */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{card.cardName}</h2>
              <p className="text-gray-400">{card.cardType}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              &times;
            </button>
          </div>

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
                <span className="font-semibold">{card.domain}</span>
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
            <div className="flex-1 bg-board-bg rounded-lg p-3 overflow-y-auto">
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
  );
}
