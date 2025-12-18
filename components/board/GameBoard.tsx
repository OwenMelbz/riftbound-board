"use client";

import { useState, useCallback } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { PlayerBoard } from "./PlayerBoard";
import { BattlefieldZone } from "./BattlefieldZone";
import { Card, CardDetailDrawer, CardZoomProvider } from "@/components/cards";
import { useBoardPerspective } from "@/hooks/useBoardPerspective";
import type { BoardState, CardInstance, ZoneType } from "@/lib/types";
import type { PlayerSide } from "@/lib/types/deck";

interface GameBoardProps {
  redBoardState: BoardState;
  blueBoardState: BoardState;
  currentPlayer: PlayerSide;
  invertOpponent?: boolean;
  onMoveCard?: (
    cardInstanceId: string,
    fromZone: ZoneType,
    toZone: ZoneType,
    fromPlayer: PlayerSide,
    toPlayer: PlayerSide,
    battlefieldSide?: PlayerSide
  ) => void;
  onFlipCard?: (cardInstanceId: string, playerSide: PlayerSide) => void;
  onExhaustCard?: (cardInstanceId: string, playerSide: PlayerSide) => void;
  onDraw?: (playerSide: PlayerSide, deckType: "main_deck" | "rune_deck") => void;
  onShuffle?: (playerSide: PlayerSide, deckType: "main_deck" | "rune_deck") => void;
  onPeek?: (playerSide: PlayerSide, deckType: "main_deck" | "rune_deck", count: number) => void;
  onRecycleRune?: (playerSide: PlayerSide, cardInstanceId: string) => void;
  // Hand card actions
  onPlayFromHand?: (playerSide: PlayerSide, cardInstanceId: string) => void;
  onPlayHiddenFromHand?: (playerSide: PlayerSide, cardInstanceId: string) => void;
  onTrashFromHand?: (playerSide: PlayerSide, cardInstanceId: string) => void;
  onRecycleFromHand?: (playerSide: PlayerSide, cardInstanceId: string) => void;
  // Champion management
  onLockChampion?: (playerSide: PlayerSide, championInstanceId: string, otherChampionIds: string[]) => void;
  onPlayChampion?: (playerSide: PlayerSide, championInstanceId: string) => void;
  // Base/battlefield card actions
  onPickup?: (playerSide: PlayerSide, cardInstanceId: string) => void;
  onTrash?: (playerSide: PlayerSide, cardInstanceId: string) => void;
  // Trash zone actions
  onRecycleTrash?: (playerSide: PlayerSide) => void;
  onPickupFromTrash?: (playerSide: PlayerSide, cardInstanceId: string) => void;
  // Battleground area actions
  onRecycleBattlegroundArea?: (playerSide: PlayerSide, cardInstanceId: string) => void;
  onSetActiveBattleground?: (playerSide: PlayerSide, cardInstanceId: string | null) => void;
  // Active battleground card instance IDs (persisted)
  redActiveBattleground?: string | null;
  blueActiveBattleground?: string | null;
  // Temp might (buff/debuff)
  onUpdateTempMight?: (cardInstanceId: string, tempMight: number | null) => void;
}

function parseZoneId(zoneId: string): { playerSide: PlayerSide; zone: ZoneType; battlefieldSide?: PlayerSide } | null {
  // Handle battlefield zones specially - they're not player-owned
  if (zoneId === "battlefield-red" || zoneId === "battlefield-blue") {
    return {
      playerSide: "red", // Doesn't matter - ownership stays with card
      zone: "battlefield",
      battlefieldSide: zoneId === "battlefield-red" ? "red" : "blue",
    };
  }

  const parts = zoneId.split("-");
  if (parts.length < 2) return null;

  const playerSide = parts[0] as PlayerSide;
  const zone = parts.slice(1).join("-") as ZoneType;

  if (playerSide !== "red" && playerSide !== "blue") return null;

  return { playerSide, zone };
}

export function GameBoard({
  redBoardState,
  blueBoardState,
  currentPlayer,
  invertOpponent = false,
  onMoveCard,
  onFlipCard,
  onExhaustCard,
  onDraw,
  onShuffle,
  onPeek,
  onRecycleRune,
  onPlayFromHand,
  onPlayHiddenFromHand,
  onTrashFromHand,
  onRecycleFromHand,
  onLockChampion,
  onPlayChampion,
  onPickup,
  onTrash,
  onRecycleTrash,
  onPickupFromTrash,
  onRecycleBattlegroundArea,
  onSetActiveBattleground,
  redActiveBattleground,
  blueActiveBattleground,
  onUpdateTempMight,
}: GameBoardProps) {
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  const [draggedCard, setDraggedCard] = useState<CardInstance | null>(null);

  // Board perspective (3D tilt with middle mouse)
  const { perspectiveStyle, handleMouseDown, resetPerspective, isAdjusting } = useBoardPerspective();

  // Champion state per player
  const [redChampionIndex, setRedChampionIndex] = useState(0);
  const [blueChampionIndex, setBlueChampionIndex] = useState(0);
  const [redChampionLocked, setRedChampionLocked] = useState(false);
  const [blueChampionLocked, setBlueChampionLocked] = useState(false);

  // Get opponent
  const opponent = currentPlayer === "red" ? "blue" : "red";
  const currentBoardState = currentPlayer === "red" ? redBoardState : blueBoardState;
  const opponentBoardState = currentPlayer === "red" ? blueBoardState : redBoardState;

  const handleCardClick = useCallback((card: CardInstance) => {
    setSelectedCard(card);
  }, []);

  // Handler for exhaust action from card components
  const handleExhaustCard = useCallback(
    (card: CardInstance) => {
      onExhaustCard?.(card.cardInstanceId, card.playerSide);
    },
    [onExhaustCard]
  );

  // Handler for flip action from card components
  const handleFlipCard = useCallback(
    (card: CardInstance) => {
      onFlipCard?.(card.cardInstanceId, card.playerSide);
    },
    [onFlipCard]
  );

  // Handler for recycle rune action
  const handleRecycleRune = useCallback(
    (card: CardInstance) => {
      onRecycleRune?.(card.playerSide, card.cardInstanceId);
    },
    [onRecycleRune]
  );


  // Hand card action handlers
  const handlePlayFromHand = useCallback(
    (card: CardInstance) => {
      onPlayFromHand?.(card.playerSide, card.cardInstanceId);
    },
    [onPlayFromHand]
  );

  const handlePlayHiddenFromHand = useCallback(
    (card: CardInstance) => {
      onPlayHiddenFromHand?.(card.playerSide, card.cardInstanceId);
    },
    [onPlayHiddenFromHand]
  );

  const handleTrashFromHand = useCallback(
    (card: CardInstance) => {
      onTrashFromHand?.(card.playerSide, card.cardInstanceId);
    },
    [onTrashFromHand]
  );

  const handleRecycleFromHand = useCallback(
    (card: CardInstance) => {
      onRecycleFromHand?.(card.playerSide, card.cardInstanceId);
    },
    [onRecycleFromHand]
  );

  // Handler for pickup action from base/battlefield
  const handlePickup = useCallback(
    (card: CardInstance) => {
      onPickup?.(card.playerSide, card.cardInstanceId);
    },
    [onPickup]
  );

  // Handler for trash action from base/battlefield
  const handleTrash = useCallback(
    (card: CardInstance) => {
      onTrash?.(card.playerSide, card.cardInstanceId);
    },
    [onTrash]
  );

  // Handler for recycling all cards from trash
  const handleRecycleTrash = useCallback(() => {
    onRecycleTrash?.(currentPlayer);
  }, [onRecycleTrash, currentPlayer]);

  // Handler for picking up a card from trash
  const handlePickupFromTrash = useCallback(
    (card: CardInstance) => {
      onPickupFromTrash?.(card.playerSide, card.cardInstanceId);
    },
    [onPickupFromTrash]
  );

  // Champion handlers - create functions for each player
  const handleNextChampion = useCallback(
    (playerSide: PlayerSide, champions: CardInstance[]) => {
      if (champions.length <= 1) return;
      const setIndex = playerSide === "red" ? setRedChampionIndex : setBlueChampionIndex;
      setIndex((prev) => (prev + 1) % champions.length);
    },
    []
  );

  const handleLockChampion = useCallback(
    (playerSide: PlayerSide, champions: CardInstance[], currentIndex: number) => {
      if (champions.length <= 1) return;
      const currentChampion = champions[currentIndex];
      const otherChampions = champions.filter((_, i) => i !== currentIndex);
      const otherChampionIds = otherChampions.map((c) => c.cardInstanceId);

      // Set locked state
      const setLocked = playerSide === "red" ? setRedChampionLocked : setBlueChampionLocked;
      const setIndex = playerSide === "red" ? setRedChampionIndex : setBlueChampionIndex;
      setLocked(true);
      setIndex(0); // Reset to 0 since there's only one champion now

      // Call parent to move other champions to deck
      onLockChampion?.(playerSide, currentChampion.cardInstanceId, otherChampionIds);
    },
    [onLockChampion]
  );

  const handlePlayChampion = useCallback(
    (playerSide: PlayerSide, champions: CardInstance[], currentIndex: number) => {
      const currentChampion = champions[currentIndex];
      if (!currentChampion) return;

      // Reset champion state for this player
      const setLocked = playerSide === "red" ? setRedChampionLocked : setBlueChampionLocked;
      const setIndex = playerSide === "red" ? setRedChampionIndex : setBlueChampionIndex;
      setLocked(false);
      setIndex(0);

      // Call parent to move champion to base (exhausted)
      onPlayChampion?.(playerSide, currentChampion.cardInstanceId);
    },
    [onPlayChampion]
  );

  // Handler for recycling a card from battlefield
  const handleRecycleBattlefield = useCallback(
    (card: CardInstance) => {
      onRecycleBattlegroundArea?.(card.playerSide, card.cardInstanceId);
    },
    [onRecycleBattlegroundArea]
  );

  // Handler for updating temp might (buff/debuff)
  const handleUpdateTempMight = useCallback(
    (card: CardInstance, tempMight: number | null) => {
      onUpdateTempMight?.(card.cardInstanceId, tempMight);
    },
    [onUpdateTempMight]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const cardInstance = event.active.data.current?.cardInstance as CardInstance | undefined;
    if (cardInstance) {
      setDraggedCard(cardInstance);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggedCard(null);

      const { active, over } = event;
      if (!over) return;

      const cardInstance = active.data.current?.cardInstance as CardInstance | undefined;
      if (!cardInstance) return;

      // Check if this is a deck draw drag
      const isDeckDraw = active.data.current?.isDeckDraw as boolean | undefined;
      const deckType = active.data.current?.deckType as "main_deck" | "rune_deck" | undefined;

      if (isDeckDraw && deckType) {
        const targetZone = parseZoneId(over.id as string);
        if (!targetZone) return;

        // Main deck can only draw to hand
        if (deckType === "main_deck" && targetZone.zone === "hand" && targetZone.playerSide === currentPlayer) {
          onDraw?.(currentPlayer, "main_deck");
          return;
        }

        // Rune deck can only draw to runes zone
        if (deckType === "rune_deck" && targetZone.zone === "runes" && targetZone.playerSide === currentPlayer) {
          onDraw?.(currentPlayer, "rune_deck");
          return;
        }

        // Invalid drop target for deck draw - do nothing
        return;
      }

      const targetZone = parseZoneId(over.id as string);
      if (!targetZone) return;

      // Don't move if dropped on same zone (for non-battlefield zones)
      if (!targetZone.battlefieldSide) {
        const sourceZoneId = `${cardInstance.playerSide}-${cardInstance.zoneType}`;
        if (sourceZoneId === over.id) return;
      }

      // Zone validation - only allow certain card types in certain zones
      const cardType = cardInstance.card?.cardType;
      if (targetZone.zone === "runes" && cardType !== "Basic Rune") {
        return; // Only runes can go in the runes zone
      }

      // For battlefield drops, pass the battlefield side (red or blue, based on who picked the battleground card)
      const battlefieldSide = targetZone.battlefieldSide;

      onMoveCard?.(
        cardInstance.cardInstanceId,
        cardInstance.zoneType,
        targetZone.zone,
        cardInstance.playerSide, // Keep original owner
        cardInstance.playerSide, // Don't change ownership
        battlefieldSide
      );
    },
    [onMoveCard, onDraw, currentPlayer]
  );

  return (
    <CardZoomProvider>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          className={`flex flex-col gap-4 p-4 min-h-screen ${isAdjusting ? "cursor-grabbing" : ""}`}
          style={perspectiveStyle}
          onMouseDown={handleMouseDown}
          onDoubleClick={resetPerspective}
        >
          {/* Opponent's Board - no actions except viewing cards */}
          <PlayerBoard
            playerSide={opponent}
            boardState={opponentBoardState}
            isCurrentPlayer={false}
            isInverted={invertOpponent}
            onCardClick={handleCardClick}
            championIndex={opponent === "red" ? redChampionIndex : blueChampionIndex}
            isChampionLocked={opponent === "red" ? redChampionLocked : blueChampionLocked}
          />

          {/* Battlefield (shared) */}
          <BattlefieldZone
            redCards={redBoardState.zones.battlefield}
            blueCards={blueBoardState.zones.battlefield}
            currentPlayer={currentPlayer}
            redActiveBattleground={redActiveBattleground ?? null}
            blueActiveBattleground={blueActiveBattleground ?? null}
            onCardClick={handleCardClick}
            onExhaustCard={handleExhaustCard}
            onFlipCard={handleFlipCard}
            onPickup={handlePickup}
            onTrash={handleTrash}
            onRecycle={handleRecycleBattlefield}
            onSetActiveBattleground={onSetActiveBattleground}
            onUpdateTempMight={handleUpdateTempMight}
          />

          {/* Current Player's Board */}
          <PlayerBoard
            playerSide={currentPlayer}
            boardState={currentBoardState}
            isCurrentPlayer={true}
            isInverted={false}
            onCardClick={handleCardClick}
            onExhaustCard={handleExhaustCard}
            onFlipCard={handleFlipCard}
            onDraw={(deckType) => onDraw?.(currentPlayer, deckType)}
            onShuffle={(deckType) => onShuffle?.(currentPlayer, deckType)}
            onPeek={(deckType, count) => onPeek?.(currentPlayer, deckType, count)}
            onRecycleRune={handleRecycleRune}
            onPlayFromHand={handlePlayFromHand}
            onPlayHiddenFromHand={handlePlayHiddenFromHand}
            onTrashFromHand={handleTrashFromHand}
            onRecycleFromHand={handleRecycleFromHand}
            onPickup={handlePickup}
            onTrash={handleTrash}
            onUpdateTempMight={handleUpdateTempMight}
            onRecycleTrash={handleRecycleTrash}
            onPickupFromTrash={handlePickupFromTrash}
            championIndex={currentPlayer === "red" ? redChampionIndex : blueChampionIndex}
            isChampionLocked={currentPlayer === "red" ? redChampionLocked : blueChampionLocked}
            onNextChampion={() => handleNextChampion(currentPlayer, currentBoardState.zones.champion)}
            onLockChampion={() => handleLockChampion(currentPlayer, currentBoardState.zones.champion, currentPlayer === "red" ? redChampionIndex : blueChampionIndex)}
            onPlayChampion={() => handlePlayChampion(currentPlayer, currentBoardState.zones.champion, currentPlayer === "red" ? redChampionIndex : blueChampionIndex)}
          />
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedCard && draggedCard.card && (
            <Card
              card={draggedCard.card}
              isFaceUp={draggedCard.isFaceUp}
              isExhausted={draggedCard.isExhausted}
              isDragging={true}
            />
          )}
        </DragOverlay>

        {/* Card Detail Drawer */}
        <CardDetailDrawer
          card={selectedCard?.card || null}
          open={selectedCard !== null}
          onOpenChange={(open) => !open && setSelectedCard(null)}
        />
      </DndContext>
    </CardZoomProvider>
  );
}
