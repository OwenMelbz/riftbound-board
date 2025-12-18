"use client";

import { useEffect, useState } from "react";
import { Card, CardWithZoom, CardContextMenu } from "@/components/cards";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ContextMenuAction } from "@/components/cards";
import type { CardInstance } from "@/lib/types";

interface RuneCardProps {
  cardInstance: CardInstance;
  onViewDetails?: (card: CardInstance) => void;
  onExhaust?: (card: CardInstance) => void;
  onRecycle?: (card: CardInstance) => void;
}

export function RuneCard({
  cardInstance,
  onViewDetails,
  onExhaust,
  onRecycle,
}: RuneCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showRecycleConfirm, setShowRecycleConfirm] = useState(false);

  // Keyboard shortcuts when hovering
  useEffect(() => {
    if (!isHovered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if a drawer/dialog is open
      if (document.querySelector('[data-vaul-drawer]') || document.querySelector('[role="dialog"]')) {
        return;
      }
      // Ignore if any modifier key is pressed
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return;
      }
      if ((e.key === "e" || e.key === "E") && onExhaust) {
        e.preventDefault();
        setIsHovered(false);
        onExhaust(cardInstance);
      }
      if ((e.key === "r" || e.key === "R") && onRecycle) {
        e.preventDefault();
        setIsHovered(false);
        setShowRecycleConfirm(true);
      }
      if (e.key === " " && onViewDetails) {
        e.preventDefault();
        setIsHovered(false);
        onViewDetails(cardInstance);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, onExhaust, onRecycle, onViewDetails, cardInstance]);

  // Build context menu actions for rune cards
  const contextActions: ContextMenuAction[] = [];

  if (onExhaust) {
    contextActions.push({
      label: cardInstance.isExhausted ? "Ready" : "Exhaust",
      onClick: () => onExhaust(cardInstance),
      shortcut: "E",
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
      <div className="flex-shrink-0">
        <CardContextMenu actions={contextActions}>
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <CardWithZoom card={cardInstance.card} isFaceUp={cardInstance.isFaceUp}>
              <div className="card-highlight rounded-lg">
                <Card
                  card={cardInstance.card}
                  isFaceUp={cardInstance.isFaceUp}
                  isExhausted={cardInstance.isExhausted}
                  isRune={true}
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
        title="Recycle Rune"
        description="Recycle this rune to the bottom of your rune deck?"
        confirmLabel="Recycle"
        onConfirm={() => onRecycle?.(cardInstance)}
      />
    </>
  );
}
