"use client";

import { useEffect, useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CardStack, CardContextMenu } from "@/components/cards";
import type { ContextMenuAction } from "@/components/cards";
import type { CardInstance } from "@/lib/types";
import { PeekDrawer } from "@/components/ui/PeekDrawer";

interface DeckZoneProps {
  id: string;
  label: string;
  count: number;
  cards?: CardInstance[]; // The actual deck cards for peeking
  variant?: "default" | "rune";
  isInverted?: boolean;
  onDraw?: () => void;
  onShuffle?: () => void;
  onPeek?: (count: number) => void;
}

export function DeckZone({
  id,
  label,
  count,
  cards = [],
  variant = "default",
  isInverted = false,
  onDraw,
  onShuffle,
  onPeek,
}: DeckZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const [isHovered, setIsHovered] = useState(false);
  const [peekDrawerOpen, setPeekDrawerOpen] = useState(false);

  // Get top card for dragging
  const topCard = cards.length > 0
    ? [...cards].sort((a, b) => b.position - a.position)[0]
    : undefined;

  // Make top card draggable (only if we have cards and onDraw is available)
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: topCard ? `deck-top-${id}-${topCard.cardInstanceId}` : `deck-top-${id}-empty`,
    data: {
      cardInstance: topCard,
      isDeckDraw: true,
      deckType: variant === "rune" ? "rune_deck" : "main_deck",
    },
    disabled: !topCard || !onDraw,
  });

  const handlePeek = () => {
    setPeekDrawerOpen(true);
    // Initial peek with 1 card - will be called again when count changes
    onPeek?.(1);
  };

  const handlePeekCountChange = (count: number) => {
    onPeek?.(count);
  };

  // Keyboard shortcuts when hovering
  useEffect(() => {
    if (!isHovered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if a drawer/dialog is open
      if (document.querySelector('[data-vaul-drawer]') || document.querySelector('[role="dialog"]')) {
        return;
      }
      if ((e.key === "d" || e.key === "D") && onDraw && count > 0) {
        e.preventDefault();
        onDraw();
      }
      if ((e.key === "s" || e.key === "S") && onShuffle && count > 0) {
        e.preventDefault();
        onShuffle();
      }
      // Peek shortcut (only if we have cards data, meaning we're the owner)
      if ((e.key === "p" || e.key === "P") && cards.length > 0) {
        e.preventDefault();
        handlePeek();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, onDraw, onShuffle, count, cards.length]);

  // Build context menu actions
  const contextActions: ContextMenuAction[] = [];

  if (onDraw && count > 0) {
    contextActions.push({
      label: "Draw",
      onClick: onDraw,
      shortcut: "D",
    });
  }

  if (onShuffle && count > 0) {
    contextActions.push({
      label: "Shuffle",
      onClick: onShuffle,
      shortcut: "S",
    });
  }

  // Single peek option for both deck types (only if we have cards data, meaning we're the owner)
  if (cards.length > 0) {
    contextActions.push({
      label: "Peek",
      onClick: handlePeek,
      shortcut: "P",
    });
  }

  return (
    <>
      <div
        ref={setNodeRef}
        className={`
          flex flex-col items-center gap-2
          ${isOver ? "bg-gold/10 rounded-lg" : ""}
          transition-colors duration-200
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span
          className="text-xs text-gold/70"
          style={isInverted ? { transform: "rotate(180deg)" } : undefined}
        >
          {label}
        </span>
        <CardContextMenu actions={contextActions}>
          <div
            ref={setDragRef}
            {...attributes}
            {...listeners}
            className={isDragging ? "opacity-50" : ""}
            style={{ touchAction: "none" }}
          >
            <CardStack
              count={count}
              variant={variant}
              onClick={onDraw}
            />
          </div>
        </CardContextMenu>
      </div>

      {/* Peek Drawer */}
      <PeekDrawer
        open={peekDrawerOpen}
        onOpenChange={setPeekDrawerOpen}
        cards={cards}
        deckLabel={label}
        onPeekCountChange={handlePeekCountChange}
      />
    </>
  );
}
