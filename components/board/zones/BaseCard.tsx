"use client";

import { useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardWithZoom, CardContextMenu } from "@/components/cards";
import type { ContextMenuAction } from "@/components/cards";
import type { CardInstance } from "@/lib/types";

interface BaseCardProps {
  cardInstance: CardInstance;
  isOwner?: boolean; // Whether the current player owns this card
  onViewDetails?: (card: CardInstance) => void;
  onExhaust?: (card: CardInstance) => void;
  onFlip?: (card: CardInstance) => void;
  onPickup?: (card: CardInstance) => void;
  onTrash?: (card: CardInstance) => void;
  onUpdateTempMight?: (card: CardInstance, tempMight: number | null) => void;
}

export function BaseCard({
  cardInstance,
  isOwner = true,
  onViewDetails,
  onExhaust,
  onFlip,
  onPickup,
  onTrash,
  onUpdateTempMight,
}: BaseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Make the card draggable
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `base-${cardInstance.cardInstanceId}`,
    data: { cardInstance },
    disabled: !isOwner,
  });

  // Card types that can be exhausted (not spells)
  const canExhaust = cardInstance.card?.cardType &&
    !["Spell", "Signature Spell"].includes(cardInstance.card.cardType);

  // Keyboard shortcuts when hovering
  useEffect(() => {
    if (!isHovered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if a drawer/dialog is open
      if (document.querySelector('[data-vaul-drawer]') || document.querySelector('[role="dialog"]')) {
        return;
      }
      if ((e.key === "e" || e.key === "E") && onExhaust && canExhaust) {
        e.preventDefault();
        onExhaust(cardInstance);
      }
      if ((e.key === "f" || e.key === "F") && onFlip) {
        e.preventDefault();
        onFlip(cardInstance);
      }
      // Only allow viewing details if card is face up OR viewer is the owner
      if (e.key === " " && onViewDetails && (cardInstance.isFaceUp || isOwner)) {
        e.preventDefault();
        onViewDetails(cardInstance);
      }
      // Pickup (return to hand) with H key
      if ((e.key === "h" || e.key === "H") && onPickup) {
        e.preventDefault();
        onPickup(cardInstance);
      }
      // Trash with T key
      if ((e.key === "t" || e.key === "T") && onTrash) {
        e.preventDefault();
        onTrash(cardInstance);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, onExhaust, onFlip, onViewDetails, onPickup, onTrash, cardInstance, isOwner, canExhaust]);

  // Build context menu actions for base cards
  const contextActions: ContextMenuAction[] = [];

  if (onExhaust && canExhaust) {
    contextActions.push({
      label: cardInstance.isExhausted ? "Ready" : "Exhaust",
      onClick: () => onExhaust(cardInstance),
      shortcut: "E",
    });
  }

  if (onFlip) {
    contextActions.push({
      label: "Flip",
      onClick: () => onFlip(cardInstance),
      shortcut: "F",
    });
  }

  // Only show view details for face-up cards OR if owner
  if (onViewDetails && (cardInstance.isFaceUp || isOwner)) {
    contextActions.push({
      label: "View Details",
      onClick: () => onViewDetails(cardInstance),
      shortcut: "Space",
    });
  }

  if (onPickup) {
    contextActions.push({
      label: "Return to Hand",
      onClick: () => onPickup(cardInstance),
      shortcut: "H",
    });
  }

  if (onTrash) {
    contextActions.push({
      label: "Trash",
      onClick: () => onTrash(cardInstance),
      shortcut: "T",
    });
  }

  // Add buff/debuff options - only for unit cards (cards with might)
  const isUnit = cardInstance.card?.might !== null && cardInstance.card?.might !== undefined;
  if (onUpdateTempMight && isUnit) {
    // Only show "Buff" if tempMight is not set yet
    if (cardInstance.tempMight === undefined || cardInstance.tempMight === null) {
      contextActions.push({
        label: "Buff",
        onClick: () => onUpdateTempMight(cardInstance, 1),
      });
    }
    // Only show "Remove Buff" if tempMight is set
    if (cardInstance.tempMight !== undefined && cardInstance.tempMight !== null) {
      contextActions.push({
        label: "Remove Buff",
        onClick: () => onUpdateTempMight(cardInstance, null),
        destructive: true,
      });
    }
  }

  if (!cardInstance.card) return null;

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 ${isDragging ? "opacity-50" : ""}`}
      style={{ touchAction: "none" }}
      {...attributes}
    >
      <CardContextMenu actions={contextActions}>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          {...listeners}
        >
          <CardWithZoom card={cardInstance.card} isFaceUp={cardInstance.isFaceUp} isOwner={isOwner}>
            <div className="card-highlight rounded-lg">
              <Card
                card={cardInstance.card}
                isFaceUp={cardInstance.isFaceUp}
                isExhausted={cardInstance.isExhausted}
                size="lg"
                tempMight={cardInstance.tempMight}
                onTempMightChange={
                  onUpdateTempMight
                    ? (delta) => {
                        const currentMight = cardInstance.tempMight ?? 0;
                        const newMight = currentMight + delta;
                        onUpdateTempMight(cardInstance, newMight);
                      }
                    : undefined
                }
                              />
            </div>
          </CardWithZoom>
        </div>
      </CardContextMenu>
    </div>
  );
}
