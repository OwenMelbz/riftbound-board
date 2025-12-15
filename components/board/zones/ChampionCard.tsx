"use client";

import { useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardWithZoom, CardContextMenu } from "@/components/cards";
import type { ContextMenuAction } from "@/components/cards";
import type { CardInstance } from "@/lib/types";

interface ChampionCardProps {
  champions: CardInstance[];
  currentIndex: number;
  isLocked: boolean;
  onViewDetails?: (card: CardInstance) => void;
  onExhaust?: (card: CardInstance) => void;
  onNextChampion?: () => void;
  onLockChampion?: () => void;
  onPlayChampion?: () => void;
}

export function ChampionCard({
  champions,
  currentIndex,
  isLocked,
  onViewDetails,
  onExhaust,
  onNextChampion,
  onLockChampion,
  onPlayChampion,
}: ChampionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const currentChampion = champions[currentIndex];
  const hasMultipleChampions = champions.length > 1;

  // Auto-lock if only one champion, otherwise use the passed isLocked state
  const effectivelyLocked = isLocked || champions.length === 1;

  // Make the champion draggable - only when locked (champion chosen)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: currentChampion ? `champion-${currentChampion.cardInstanceId}` : "champion-empty",
    data: { cardInstance: currentChampion },
    disabled: !effectivelyLocked || !currentChampion,
  });

  // Keyboard shortcuts when hovering
  useEffect(() => {
    if (!isHovered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if a drawer/dialog is open
      if (document.querySelector('[data-vaul-drawer]') || document.querySelector('[role="dialog"]')) {
        return;
      }
      // E key to exhaust/ready (only when locked)
      if ((e.key === "e" || e.key === "E") && onExhaust && effectivelyLocked && currentChampion) {
        e.preventDefault();
        onExhaust(currentChampion);
      }
      // S key to cycle champions (only if not locked and multiple champions)
      if ((e.key === "s" || e.key === "S") && onNextChampion && !isLocked && hasMultipleChampions) {
        e.preventDefault();
        onNextChampion();
      }
      // L key to lock champion (only if not locked and multiple champions)
      if ((e.key === "l" || e.key === "L") && onLockChampion && !isLocked && hasMultipleChampions) {
        e.preventDefault();
        onLockChampion();
      }
      // D key to play champion
      if ((e.key === "d" || e.key === "D") && onPlayChampion) {
        e.preventDefault();
        onPlayChampion();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, onNextChampion, onLockChampion, onPlayChampion, onExhaust, isLocked, hasMultipleChampions, effectivelyLocked, currentChampion]);

  // Build context menu actions for champion
  const contextActions: ContextMenuAction[] = [];

  // Exhaust/Ready - only when locked
  if (onExhaust && effectivelyLocked && currentChampion) {
    contextActions.push({
      label: currentChampion.isExhausted ? "Ready" : "Exhaust",
      onClick: () => onExhaust(currentChampion),
      shortcut: "E",
    });
  }

  // Next Champion - only if multiple champions and not locked
  if (onNextChampion && hasMultipleChampions && !isLocked) {
    contextActions.push({
      label: "Next Champion",
      onClick: onNextChampion,
      shortcut: "S",
    });
  }

  // Lock Champion - only if multiple champions and not locked
  if (onLockChampion && hasMultipleChampions && !isLocked) {
    contextActions.push({
      label: "Lock Champion",
      onClick: onLockChampion,
      shortcut: "L",
    });
  }

  // Play Champion - always available
  if (onPlayChampion) {
    contextActions.push({
      label: "Play",
      onClick: onPlayChampion,
      shortcut: "D",
    });
  }

  if (onViewDetails && currentChampion) {
    contextActions.push({
      label: "View Details",
      onClick: () => onViewDetails(currentChampion),
      shortcut: "Space",
    });
  }

  if (!currentChampion?.card) return null;

  return (
    <div
      ref={setNodeRef}
      className={`${isDragging ? "opacity-50" : ""} ${effectivelyLocked ? "cursor-grab" : ""}`}
      style={{ touchAction: "none" }}
      {...attributes}
    >
      <CardContextMenu actions={contextActions}>
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          {...listeners}
        >
          {/* Stack effect for multiple champions */}
          {hasMultipleChampions && !isLocked && (
            <>
              {champions.length > 2 && (
                <div className="absolute inset-0 bg-board-zone border border-board-border rounded-lg transform translate-x-1.5 translate-y-1.5 -z-20" />
              )}
              <div className="absolute inset-0 bg-board-zone border border-board-border rounded-lg transform translate-x-1 translate-y-1 -z-10" />
            </>
          )}

          <CardWithZoom card={currentChampion.card} isFaceUp={currentChampion.isFaceUp}>
            <Card
              card={currentChampion.card}
              isFaceUp={currentChampion.isFaceUp}
              isExhausted={currentChampion.isExhausted}
              size="md"
              onViewDetails={() => onViewDetails?.(currentChampion)}
            />
          </CardWithZoom>

          {/* Champion count badge */}
          {hasMultipleChampions && !isLocked && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-board-bg rounded-full flex items-center justify-center text-xs font-bold z-10">
              {champions.length}
            </div>
          )}
        </div>
      </CardContextMenu>
    </div>
  );
}
