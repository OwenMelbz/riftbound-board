"use client";

import { useEffect, useState } from "react";
import { CardWithZoom, CardContextMenu } from "@/components/cards";
import type { ContextMenuAction } from "@/components/cards";
import type { CardInstance } from "@/lib/types";
import type { PlayerSide } from "@/lib/types/deck";

interface BattlegroundPileProps {
  cards: CardInstance[];
  activeCardInstanceId: string | null;
  isOwner: boolean;
  playerSide: PlayerSide;
  onCardClick?: (card: CardInstance) => void;
  onSetActiveBattleground?: (cardInstanceId: string) => void;
}

export function BattlegroundPile({
  cards,
  activeCardInstanceId,
  isOwner,
  playerSide,
  onCardClick,
  onSetActiveBattleground,
}: BattlegroundPileProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Find the active card index
  const activeCardIndex = activeCardInstanceId
    ? cards.findIndex(c => c.cardInstanceId === activeCardInstanceId)
    : 0;

  const currentIndex = activeCardIndex >= 0 ? activeCardIndex : 0;
  const currentCard = cards[currentIndex] || null;
  const hasMultiple = cards.length > 1;

  // Cycle to next card and update backend
  const handleNext = () => {
    if (cards.length <= 1 || !onSetActiveBattleground) return;
    const nextIndex = (currentIndex + 1) % cards.length;
    const nextCard = cards[nextIndex];
    if (nextCard) {
      onSetActiveBattleground(nextCard.cardInstanceId);
    }
  };

  // Keyboard shortcuts when hovering
  useEffect(() => {
    if (!isHovered || !isOwner) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if a drawer/dialog is open
      if (document.querySelector('[data-vaul-drawer]') || document.querySelector('[role="dialog"]')) {
        return;
      }
      // S to switch to next battleground
      if ((e.key === "s" || e.key === "S") && hasMultiple) {
        e.preventDefault();
        handleNext();
      }
      // Spacebar to view details
      if (e.key === " " && currentCard && onCardClick) {
        e.preventDefault();
        onCardClick(currentCard);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, isOwner, hasMultiple, currentCard, onCardClick]);

  // Build context menu actions
  const contextActions: ContextMenuAction[] = [];

  if (isOwner && hasMultiple) {
    contextActions.push({
      label: "Next Battleground",
      onClick: handleNext,
      shortcut: "S",
    });
  }

  if (currentCard && onCardClick) {
    contextActions.push({
      label: "View Details",
      onClick: () => onCardClick(currentCard),
      shortcut: "Space",
    });
  }

  // Empty slot when no battleground cards
  if (!currentCard) {
    return (
      <div
        className="rounded-lg border-2 border-dashed border-board-border flex items-center justify-center"
        style={{ width: "178px", height: "250px" }}
      >
        <span className="text-xs text-gold/30">Battleground</span>
      </div>
    );
  }

  const borderColor = playerSide === "red" ? "border-red-500" : "border-blue-500";

  const cardContent = (
    <div
      className={`relative rounded-lg overflow-hidden cursor-pointer hover:scale-105 hover:z-10 transition-all duration-200 flex-shrink-0 border-2 ${borderColor} flex items-center justify-center`}
      style={{ width: "178px", height: "250px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {currentCard.card?.imageUrl ? (
        <img
          src={currentCard.card.imageUrl}
          alt={currentCard.card.cardName}
          className="rotate-90 select-none pointer-events-none"
          draggable={false}
          style={{
            height: "178px",
            width: "auto",
            minWidth: "250px",
          }}
        />
      ) : (
        <span className="text-xs text-gray-400">Battleground</span>
      )}

      {/* Card count indicator */}
      {hasMultiple && (
        <div className="absolute top-1 right-1 text-xs px-1.5 py-0.5 rounded bg-black/70 text-gold">
          {currentIndex + 1}/{cards.length}
        </div>
      )}
    </div>
  );

  return (
    <CardContextMenu actions={contextActions}>
      <div className="flex items-center justify-center" style={{ width: "185px" }}>
        {currentCard.card ? (
          <CardWithZoom card={currentCard.card} isFaceUp={true}>
            {cardContent}
          </CardWithZoom>
        ) : (
          cardContent
        )}
      </div>
    </CardContextMenu>
  );
}
