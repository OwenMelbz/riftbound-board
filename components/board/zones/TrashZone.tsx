"use client";

import { useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContextMenu, CardWithZoom, useModifierPressed } from "@/components/cards";
import type { ContextMenuAction } from "@/components/cards";
import type { CardInstance } from "@/lib/types";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface TrashZoneProps {
  id: string;
  cards: CardInstance[];
  isInverted?: boolean;
  onCardClick?: (card: CardInstance) => void;
  onRecycle?: () => void;
  onPickupFromTrash?: (card: CardInstance) => void;
}

export function TrashZone({
  id,
  cards,
  isInverted = false,
  onCardClick,
  onRecycle,
  onPickupFromTrash,
}: TrashZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const [isHovered, setIsHovered] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showRecycleConfirm, setShowRecycleConfirm] = useState(false);

  const topCard = cards[cards.length - 1];

  // Keyboard shortcut for recycle when hovering
  useEffect(() => {
    if (!isHovered || !onRecycle) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if a drawer/dialog is open
      if (document.querySelector('[data-vaul-drawer]') || document.querySelector('[role="dialog"]')) {
        return;
      }
      if ((e.key === "r" || e.key === "R") && cards.length > 0) {
        e.preventDefault();
        setShowRecycleConfirm(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, onRecycle, cards.length]);

  // Build context menu actions
  const contextActions: ContextMenuAction[] = [];

  if (onRecycle && cards.length > 0) {
    contextActions.push({
      label: "Recycle All",
      onClick: () => setShowRecycleConfirm(true),
      shortcut: "R",
    });
  }

  if (cards.length > 0) {
    contextActions.push({
      label: "View All Cards",
      onClick: () => setDrawerOpen(true),
    });
  }

  const handleTrashClick = () => {
    if (cards.length > 0) {
      setDrawerOpen(true);
    }
  };

  return (
    <>
      <CardContextMenu actions={contextActions}>
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
            Trash ({cards.length})
          </span>

          <div
            className="relative w-[120px] h-[168px] cursor-pointer"
            onClick={handleTrashClick}
          >
            {/* Stack effect */}
            {cards.length > 2 && (
              <div className="absolute inset-0 bg-board-zone border border-board-border rounded-lg transform translate-x-1 translate-y-1" />
            )}
            {cards.length > 1 && (
              <div className="absolute inset-0 bg-board-zone border border-board-border rounded-lg transform translate-x-0.5 translate-y-0.5" />
            )}

            {/* Top card or empty slot */}
            {topCard && topCard.card ? (
              <div className="relative">
                <CardWithZoom card={topCard.card} isFaceUp={true}>
                  <Card
                    card={topCard.card}
                    isFaceUp={true}
                  />
                </CardWithZoom>
              </div>
            ) : (
              <div className="w-full h-full bg-board-zone border-2 border-dashed border-board-border rounded-lg flex items-center justify-center">
                <span
                  className="text-gold/30 text-xs"
                  style={isInverted ? { transform: "rotate(180deg)" } : undefined}
                >
                  Empty
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContextMenu>

      {/* Trash Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="bg-board-bg border-board-border max-h-[85vh]">
          <div className="mx-auto w-full max-w-4xl">
            <DrawerHeader className="border-b border-board-border">
              <DrawerTitle className="text-gold">Trash ({cards.length} cards)</DrawerTitle>
            </DrawerHeader>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {cards.length === 0 ? (
                <div className="text-center text-gold/30 py-8">No cards in trash</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {cards.map((cardInstance) => (
                    <TrashCard
                      key={cardInstance.cardInstanceId}
                      cardInstance={cardInstance}
                      onPickup={onPickupFromTrash ? () => {
                        onPickupFromTrash(cardInstance);
                        // Close drawer if no cards left
                        if (cards.length <= 1) {
                          setDrawerOpen(false);
                        }
                      } : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={showRecycleConfirm}
        onOpenChange={setShowRecycleConfirm}
        title="Recycle All Cards"
        description={`Recycle all ${cards.length} cards from trash to the bottom of your deck?`}
        confirmLabel="Recycle All"
        onConfirm={() => onRecycle?.()}
      />
    </>
  );
}

// Individual card in trash drawer with pickup button on hover
function TrashCard({
  cardInstance,
  onPickup,
}: {
  cardInstance: CardInstance;
  onPickup?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const modifierPressed = useModifierPressed();

  if (!cardInstance.card) return null;

  // Show pickup button when hovering but NOT when holding modifier (for zoom)
  const showPickupButton = isHovered && onPickup && !modifierPressed;

  return (
    <div
      className="relative w-[94px]"
      style={{ aspectRatio: "5/7" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardWithZoom card={cardInstance.card} isFaceUp={true}>
        <div className="w-full h-full rounded-lg overflow-hidden">
          {cardInstance.card.imageUrl ? (
            <img
              src={cardInstance.card.imageUrl}
              alt={cardInstance.card.cardName}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-board-zone border border-board-border flex items-center justify-center">
              <span className="text-xs text-gold/30">{cardInstance.card.cardName}</span>
            </div>
          )}
        </div>
      </CardWithZoom>

      {/* Pickup button overlay on hover (hidden when holding modifier for zoom) */}
      {showPickupButton && (
        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPickup();
            }}
            className="px-3 py-1.5 bg-gold text-black rounded font-semibold text-sm hover:bg-gold-light transition-colors"
          >
            Return to Hand
          </button>
        </div>
      )}
    </div>
  );
}
