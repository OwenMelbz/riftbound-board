"use client";

import { useEffect, useState } from "react";
import { Card, CardWithZoom, CardContextMenu } from "@/components/cards";
import type { ContextMenuAction } from "@/components/cards";
import type { CardInstance } from "@/lib/types";

interface LegendCardProps {
  cardInstance: CardInstance;
  onViewDetails?: (card: CardInstance) => void;
  onExhaust?: (card: CardInstance) => void;
}

export function LegendCard({
  cardInstance,
  onViewDetails,
  onExhaust,
}: LegendCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // E key shortcut to exhaust when hovering
  useEffect(() => {
    if (!isHovered || !onExhaust) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        onExhaust(cardInstance);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, onExhaust, cardInstance]);

  // Build context menu actions for legend
  const contextActions: ContextMenuAction[] = [];

  if (onExhaust) {
    contextActions.push({
      label: cardInstance.isExhausted ? "Ready" : "Exhaust",
      onClick: () => onExhaust(cardInstance),
      shortcut: "E",
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
    <CardContextMenu actions={contextActions}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardWithZoom card={cardInstance.card} isFaceUp={cardInstance.isFaceUp}>
          <Card
            card={cardInstance.card}
            isFaceUp={cardInstance.isFaceUp}
            isExhausted={cardInstance.isExhausted}
            size="md"
            onViewDetails={() => onViewDetails?.(cardInstance)}
          />
        </CardWithZoom>
      </div>
    </CardContextMenu>
  );
}
