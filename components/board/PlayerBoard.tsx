"use client";

import { useDroppable, useDndMonitor } from "@dnd-kit/core";
import { useState } from "react";
import {
  CardSlot,
  DeckZone,
  TrashZone,
  LegendCard,
  ChampionCard,
  BaseCard,
  HandCard,
  RuneCard,
} from "./zones";
import type { BoardState, CardInstance, ZoneType } from "@/lib/types";
import type { PlayerSide } from "@/lib/types/deck";

interface PlayerBoardProps {
  playerSide: PlayerSide;
  boardState: BoardState;
  isCurrentPlayer: boolean;
  isInverted?: boolean;
  onCardClick?: (card: CardInstance) => void;
  onExhaustCard?: (card: CardInstance) => void;
  onFlipCard?: (card: CardInstance) => void;
  onDraw?: (deckType: "main_deck" | "rune_deck") => void;
  onShuffle?: (deckType: "main_deck" | "rune_deck") => void;
  onPeek?: (deckType: "main_deck" | "rune_deck", count: number) => void;
  onRecycleRune?: (card: CardInstance) => void;
  // Hand card actions
  onPlayFromHand?: (card: CardInstance) => void;
  onPlayHiddenFromHand?: (card: CardInstance) => void;
  onTrashFromHand?: (card: CardInstance) => void;
  onRecycleFromHand?: (card: CardInstance) => void;
  // Base card actions
  onPickup?: (card: CardInstance) => void;
  onTrash?: (card: CardInstance) => void;
  onUpdateTempMight?: (card: CardInstance, tempMight: number | null) => void;
  // Trash zone actions
  onRecycleTrash?: () => void;
  onPickupFromTrash?: (card: CardInstance) => void;
  // Champion management
  championIndex?: number;
  isChampionLocked?: boolean;
  onNextChampion?: () => void;
  onLockChampion?: () => void;
  onPlayChampion?: () => void;
}

// Scrollable zone component for multiple cards
function ScrollableCardZone({
  id,
  label,
  children,
  labelOutside = false,
  isInverted = false,
  acceptsCardType,
  acceptsDeckDraw,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  labelOutside?: boolean;
  isInverted?: boolean;
  acceptsCardType?: (cardType: string | undefined) => boolean;
  acceptsDeckDraw?: "main_deck" | "rune_deck";
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const [draggedCardType, setDraggedCardType] = useState<string | undefined>(undefined);
  const [draggedDeckType, setDraggedDeckType] = useState<string | undefined>(undefined);

  // Track what's being dragged to validate drop targets
  useDndMonitor({
    onDragStart(event) {
      const cardInstance = event.active.data.current?.cardInstance as CardInstance | undefined;
      setDraggedCardType(cardInstance?.card?.cardType);
      // Track if this is a deck draw
      const deckType = event.active.data.current?.deckType as string | undefined;
      setDraggedDeckType(deckType);
    },
    onDragEnd() {
      setDraggedCardType(undefined);
      setDraggedDeckType(undefined);
    },
    onDragCancel() {
      setDraggedCardType(undefined);
      setDraggedDeckType(undefined);
    },
  });

  // Check if the currently dragged card is valid for this zone
  const isValidCardDrop = !acceptsCardType || acceptsCardType(draggedCardType);
  const isValidDeckDraw = acceptsDeckDraw && draggedDeckType === acceptsDeckDraw;
  const showHighlight = isOver && (isValidCardDrop || isValidDeckDraw);

  const counterRotate = isInverted ? { transform: "rotate(180deg)" } : undefined;

  if (labelOutside) {
    return (
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="text-xs text-gold/70 flex justify-between" style={counterRotate}>
          <span>{label}</span>
        </div>
        <div
          ref={setNodeRef}
          className={`
            bg-board-zone rounded-lg border-2 overflow-hidden
            ${showHighlight ? "border-gold bg-gold/10" : "border-board-border"}
            transition-colors duration-200
          `}
          style={{ height: "168px" }}
        >
          <div className="zone-scroll overflow-x-auto h-full p-2 flex gap-2 items-center">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-board-zone rounded-lg border-2 p-2 flex flex-col min-w-0 overflow-hidden
        ${showHighlight ? "border-gold bg-gold/10" : "border-board-border"}
        transition-colors duration-200 flex-1
      `}
      style={{ minHeight: "200px" }}
    >
      <div className="text-xs text-gold/70 mb-2 flex justify-between" style={counterRotate}>
        <span>{label}</span>
      </div>
      <div className="zone-scroll overflow-x-auto flex gap-2 pb-2 items-center justify-center flex-1">
        {children}
      </div>
    </div>
  );
}

export function PlayerBoard({
  playerSide,
  boardState,
  isCurrentPlayer,
  isInverted = false,
  onCardClick,
  onExhaustCard,
  onFlipCard,
  onDraw,
  onShuffle,
  onPeek,
  onRecycleRune,
  onPlayFromHand,
  onPlayHiddenFromHand,
  onTrashFromHand,
  onRecycleFromHand,
  onPickup,
  onTrash,
  onUpdateTempMight,
  onRecycleTrash,
  onPickupFromTrash,
  championIndex = 0,
  isChampionLocked = false,
  onNextChampion,
  onLockChampion,
  onPlayChampion,
}: PlayerBoardProps) {
  const zones = boardState.zones;
  const color = playerSide === "red" ? "border-red-600" : "border-blue-600";
  const bgColor = playerSide === "red" ? "bg-red-900/20" : "bg-blue-900/20";

  // Get first card from single-card zones
  const legendCard = zones.legend[0] || null;

  // Zone IDs for drag-and-drop
  const zoneId = (zone: ZoneType) => `${playerSide}-${zone}`;

  return (
    <div
      className={`${bgColor} rounded-lg border-2 ${color} p-3`}
      style={isInverted ? { transform: "rotate(180deg)" } : undefined}
    >
      {/* Top Row: Base Zone + Legend/Champion */}
      <div className="flex gap-3 mb-3">
        {/* Base Zone */}
        <ScrollableCardZone id={zoneId("base")} label="Base" isInverted={isInverted}>
          {zones.base.length === 0 ? (
            <div
              className="flex-1 flex items-center justify-center text-gold/30 text-sm min-h-[140px]"
              style={isInverted ? { transform: "rotate(180deg)" } : undefined}
            >
              No cards
            </div>
          ) : (
            [...zones.base]
              .sort((a, b) => {
                // Hidden (face-down) cards first, then sort by card ID
                if (a.isFaceUp !== b.isFaceUp) {
                  return a.isFaceUp ? 1 : -1;
                }
                return a.cardId.localeCompare(b.cardId);
              })
              .map((cardInstance) => (
                <BaseCard
                  key={cardInstance.cardInstanceId}
                  cardInstance={cardInstance}
                  isOwner={isCurrentPlayer}
                  onViewDetails={onCardClick}
                  onExhaust={isCurrentPlayer ? onExhaustCard : undefined}
                  onFlip={isCurrentPlayer ? onFlipCard : undefined}
                  onPickup={isCurrentPlayer ? onPickup : undefined}
                  onTrash={isCurrentPlayer ? onTrash : undefined}
                  onUpdateTempMight={isCurrentPlayer ? onUpdateTempMight : undefined}
                />
              ))
          )}
        </ScrollableCardZone>

        {/* Legend and Champion Column */}
        <div className="flex flex-col gap-2">
          {/* Legend Slot */}
          <CardSlot id={zoneId("legend")} label="Legend" isInverted={isInverted}>
            {legendCard && (
              <LegendCard
                cardInstance={legendCard}
                onViewDetails={isCurrentPlayer ? onCardClick : undefined}
                onExhaust={isCurrentPlayer ? onExhaustCard : undefined}
              />
            )}
          </CardSlot>

          {/* Champion Slot */}
          <CardSlot id={zoneId("champion")} label="Champion" isInverted={isInverted}>
            {zones.champion.length > 0 && (
              <ChampionCard
                champions={zones.champion}
                currentIndex={championIndex}
                isLocked={isChampionLocked}
                onViewDetails={isCurrentPlayer ? onCardClick : undefined}
                onExhaust={isCurrentPlayer ? onExhaustCard : undefined}
                onNextChampion={isCurrentPlayer ? onNextChampion : undefined}
                onLockChampion={isCurrentPlayer ? onLockChampion : undefined}
                onPlayChampion={isCurrentPlayer ? onPlayChampion : undefined}
              />
            )}
          </CardSlot>
        </div>
      </div>

      {/* Middle Row: Rune Deck + Runes Zone */}
      <div className="flex gap-3 mb-3 items-stretch">
        {/* Rune Deck */}
        <DeckZone
          id={zoneId("rune_deck")}
          label="Rune Deck"
          count={zones.rune_deck.length}
          cards={isCurrentPlayer ? zones.rune_deck : []}
          variant="rune"
          isInverted={isInverted}
          onDraw={isCurrentPlayer ? () => onDraw?.("rune_deck") : undefined}
          onShuffle={isCurrentPlayer ? () => onShuffle?.("rune_deck") : undefined}
          onPeek={isCurrentPlayer ? (count) => onPeek?.("rune_deck", count) : undefined}
        />

        {/* Runes Zone (channeled runes) */}
        <ScrollableCardZone
          id={zoneId("runes")}
          label="Runes"
          labelOutside
          isInverted={isInverted}
          acceptsCardType={(cardType) => cardType === "Basic Rune"}
          acceptsDeckDraw={isCurrentPlayer ? "rune_deck" : undefined}
        >
          {zones.runes.length === 0 ? (
            <div
              className="flex-1 flex items-center justify-center text-gold/30 text-sm h-full"
              style={isInverted ? { transform: "rotate(180deg)" } : undefined}
            >
              No cards
            </div>
          ) : (
            [...zones.runes]
              .sort((a, b) => a.cardId.localeCompare(b.cardId))
              .map((cardInstance) => (
                <RuneCard
                  key={cardInstance.cardInstanceId}
                  cardInstance={cardInstance}
                  onViewDetails={isCurrentPlayer ? onCardClick : undefined}
                  onExhaust={isCurrentPlayer ? onExhaustCard : undefined}
                  onRecycle={isCurrentPlayer ? onRecycleRune : undefined}
                />
              ))
          )}
        </ScrollableCardZone>
      </div>

      {/* Bottom Row: Deck + Hand + Trash */}
      <div className="flex gap-3 items-stretch">
        {/* Main Deck on left */}
        <DeckZone
          id={zoneId("main_deck")}
          label="Deck"
          count={zones.main_deck.length}
          cards={isCurrentPlayer ? zones.main_deck : []}
          isInverted={isInverted}
          onDraw={isCurrentPlayer ? () => onDraw?.("main_deck") : undefined}
          onShuffle={isCurrentPlayer ? () => onShuffle?.("main_deck") : undefined}
          onPeek={isCurrentPlayer ? (count) => onPeek?.("main_deck", count) : undefined}
        />

        {/* Hand Zone in middle - hidden for opponent */}
        <ScrollableCardZone
          id={zoneId("hand")}
          label={isCurrentPlayer ? "Hand" : `Opponent's Hand (${zones.hand.length})`}
          labelOutside
          isInverted={isInverted}
          acceptsDeckDraw={isCurrentPlayer ? "main_deck" : undefined}
        >
          {!isCurrentPlayer ? (
            zones.hand.length === 0 ? (
              <div
                className="flex-1 flex items-center justify-center text-gold/30 text-sm h-full"
                style={isInverted ? { transform: "rotate(180deg)" } : undefined}
              >
                No cards
              </div>
            ) : (
              zones.hand.map((cardInstance) => (
                <div
                  key={cardInstance.cardInstanceId}
                  className="flex-shrink-0"
                  style={isInverted ? { transform: "rotate(180deg)" } : undefined}
                >
                  <div className="w-[100px] card-aspect rounded-lg overflow-hidden">
                    <img
                      src="/card-back.png"
                      alt="Card back"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                </div>
              ))
            )
          ) : zones.hand.length === 0 ? (
            <div
              className="flex-1 flex items-center justify-center text-gold/30 text-sm h-full"
              style={isInverted ? { transform: "rotate(180deg)" } : undefined}
            >
              No cards
            </div>
          ) : (
            [...zones.hand]
              .sort((a, b) => a.cardId.localeCompare(b.cardId))
              .map((cardInstance) => (
                <HandCard
                  key={cardInstance.cardInstanceId}
                  cardInstance={cardInstance}
                  onViewDetails={onCardClick}
                  onPlay={onPlayFromHand}
                  onPlayHidden={onPlayHiddenFromHand}
                  onTrash={onTrashFromHand}
                  onRecycle={onRecycleFromHand}
                />
              ))
          )}
        </ScrollableCardZone>

        {/* Trash on right */}
        <TrashZone
          id={zoneId("trash")}
          cards={zones.trash}
          isInverted={isInverted}
          onCardClick={isCurrentPlayer ? onCardClick : undefined}
          onRecycle={isCurrentPlayer ? onRecycleTrash : undefined}
          onPickupFromTrash={isCurrentPlayer ? onPickupFromTrash : undefined}
        />
      </div>
    </div>
  );
}
