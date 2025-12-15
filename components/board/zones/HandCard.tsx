"use client";

import { useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardWithZoom, CardContextMenu } from "@/components/cards";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ContextMenuAction } from "@/components/cards";
import type { CardInstance } from "@/lib/types";

interface HandCardProps {
  cardInstance: CardInstance;
  onViewDetails?: (card: CardInstance) => void;
  onPlay?: (card: CardInstance) => void;
  onPlayHidden?: (card: CardInstance) => void;
  onTrash?: (card: CardInstance) => void;
  onRecycle?: (card: CardInstance) => void;
}

export function HandCard({
  cardInstance,
  onViewDetails,
  onPlay,
  onPlayHidden,
  onTrash,
  onRecycle,
}: HandCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showRecycleConfirm, setShowRecycleConfirm] = useState(false);

  // Make the card draggable
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `hand-${cardInstance.cardInstanceId}`,
    data: { cardInstance },
  });

  // Keyboard shortcuts when hovering
  useEffect(() => {
    if (!isHovered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if a drawer/dialog is open
      if (document.querySelector('[data-vaul-drawer]') || document.querySelector('[role="dialog"]')) {
        return;
      }
      if (e.key === " " && onViewDetails) {
        e.preventDefault();
        onViewDetails(cardInstance);
      }
      if ((e.key === "p" || e.key === "P") && onPlay) {
        e.preventDefault();
        onPlay(cardInstance);
      }
      if ((e.key === "t" || e.key === "T") && onTrash) {
        e.preventDefault();
        onTrash(cardInstance);
      }
      if ((e.key === "r" || e.key === "R") && onRecycle) {
        e.preventDefault();
        setShowRecycleConfirm(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, onViewDetails, onPlay, onTrash, onRecycle, cardInstance]);

  // Build context menu actions for hand cards
  const contextActions: ContextMenuAction[] = [];

  if (onPlay) {
    contextActions.push({
      label: "Play",
      onClick: () => onPlay(cardInstance),
      shortcut: "P",
    });
  }

  if (onPlayHidden) {
    contextActions.push({
      label: "Play Hidden",
      onClick: () => onPlayHidden(cardInstance),
    });
  }

  if (onTrash) {
    contextActions.push({
      label: "Trash",
      onClick: () => onTrash(cardInstance),
      shortcut: "T",
    });
  }

  if (onRecycle) {
    contextActions.push({
      label: "Recycle",
      onClick: () => setShowRecycleConfirm(true),
      shortcut: "R",
    });
  }

  if (onViewDetails) {
    contextActions.push({
      label: "View Details",
      onClick: () => onViewDetails(cardInstance),
      shortcut: "Space",
    });
  }

  if (!cardInstance.card) return null;

  return (
    <>
      <div
        ref={setNodeRef}
        className={`flex-shrink-0 cursor-grab ${isDragging ? "opacity-50" : ""}`}
        style={{ touchAction: "none" }}
        {...attributes}
      >
        <CardContextMenu actions={contextActions}>
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...listeners}
          >
            <CardWithZoom card={cardInstance.card} isFaceUp={cardInstance.isFaceUp}>
              <div className="card-highlight rounded-lg">
                <Card
                  card={cardInstance.card}
                  isFaceUp={cardInstance.isFaceUp}
                  isExhausted={cardInstance.isExhausted}
                  isRune={cardInstance.card.cardType === "Basic Rune"}
                  size="sm"
                />
              </div>
            </CardWithZoom>
          </div>
        </CardContextMenu>
      </div>

      <ConfirmDialog
        open={showRecycleConfirm}
        onOpenChange={setShowRecycleConfirm}
        title="Recycle Card"
        description="Recycle this card to the bottom of your deck?"
        confirmLabel="Recycle"
        onConfirm={() => onRecycle?.(cardInstance)}
      />
    </>
  );
}
