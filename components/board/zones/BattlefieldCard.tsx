"use client";

import { useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardWithZoom, CardContextMenu } from "@/components/cards";
import type { ContextMenuAction } from "@/components/cards";
import type { CardInstance } from "@/lib/types";
import type { PlayerSide } from "@/lib/types/deck";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface BattlefieldCardProps {
  cardInstance: CardInstance;
  currentPlayer: PlayerSide;
  onViewDetails?: (card: CardInstance) => void;
  onExhaust?: (card: CardInstance) => void;
  onFlip?: (card: CardInstance) => void;
  onPickup?: (card: CardInstance) => void;
  onTrash?: (card: CardInstance) => void;
  onRecycle?: (card: CardInstance) => void;
  onUpdateTempMight?: (card: CardInstance, tempMight: number | null) => void;
}

export function BattlefieldCard({
  cardInstance,
  currentPlayer,
  onViewDetails,
  onExhaust,
  onFlip,
  onPickup,
  onTrash,
  onRecycle,
  onUpdateTempMight,
}: BattlefieldCardProps) {
  // Only the card's owner can interact with it
  const isOwner = cardInstance.playerSide === currentPlayer;
  const [isHovered, setIsHovered] = useState(false);
  const [showRecycleConfirm, setShowRecycleConfirm] = useState(false);

  // Make the card draggable - only owner can drag
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `battlefield-${cardInstance.cardInstanceId}`,
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
        setIsHovered(false);
        onExhaust(cardInstance);
      }
      if ((e.key === "f" || e.key === "F") && onFlip) {
        e.preventDefault();
        setIsHovered(false);
        onFlip(cardInstance);
      }
      if (e.key === " " && onViewDetails) {
        e.preventDefault();
        setIsHovered(false);
        onViewDetails(cardInstance);
      }
      // Pickup (return to hand) with H key
      if ((e.key === "h" || e.key === "H") && onPickup) {
        e.preventDefault();
        setIsHovered(false);
        onPickup(cardInstance);
      }
      // Trash with T key
      if ((e.key === "t" || e.key === "T") && onTrash) {
        e.preventDefault();
        setIsHovered(false);
        onTrash(cardInstance);
      }
      // Recycle with R key (with confirmation)
      if ((e.key === "r" || e.key === "R") && onRecycle) {
        e.preventDefault();
        setIsHovered(false);
        setShowRecycleConfirm(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, onExhaust, onFlip, onViewDetails, onPickup, onTrash, onRecycle, cardInstance, canExhaust]);

  // Build context menu actions for battlefield cards
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

  if (onViewDetails) {
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

  if (onRecycle) {
    contextActions.push({
      label: "Recycle",
      onClick: () => setShowRecycleConfirm(true),
      shortcut: "R",
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
    <>
      <div
        ref={setNodeRef}
        className={`flex-shrink-0 ${isDragging ? "opacity-50" : ""} ${isOwner ? "cursor-grab" : ""}`}
        style={{ touchAction: "none" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...attributes}
      >
        <CardContextMenu actions={contextActions}>
          <div {...listeners}>
            <CardWithZoom card={cardInstance.card} isFaceUp={cardInstance.isFaceUp}>
              <div className="card-highlight rounded-lg">
                <Card
                  card={cardInstance.card}
                  isFaceUp={cardInstance.isFaceUp}
                  isExhausted={cardInstance.isExhausted}
                  size="xs"
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
                                    onViewDetails={() => onViewDetails?.(cardInstance)}
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
        description={`Recycle "${cardInstance.card.cardName}" to the bottom of your deck?`}
        confirmLabel="Recycle"
        onConfirm={() => onRecycle?.(cardInstance)}
      />
    </>
  );
}
