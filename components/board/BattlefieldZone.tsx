"use client";

import { useDroppable } from "@dnd-kit/core";
import { BattlefieldCard, BattlegroundPile } from "./zones";
import type { CardInstance } from "@/lib/types";
import type { PlayerSide } from "@/lib/types/deck";

interface BattlefieldZoneProps {
  redCards: CardInstance[];
  blueCards: CardInstance[];
  currentPlayer: PlayerSide;
  redActiveBattleground: string | null;
  blueActiveBattleground: string | null;
  onCardClick?: (card: CardInstance) => void;
  onExhaustCard?: (card: CardInstance) => void;
  onFlipCard?: (card: CardInstance) => void;
  onPickup?: (card: CardInstance) => void;
  onTrash?: (card: CardInstance) => void;
  onRecycle?: (card: CardInstance) => void;
  onSetActiveBattleground?: (playerSide: PlayerSide, cardInstanceId: string) => void;
  onUpdateTempMight?: (card: CardInstance, tempMight: number | null) => void;
}

export function BattlefieldZone({
  redCards,
  blueCards,
  currentPlayer,
  redActiveBattleground,
  blueActiveBattleground,
  onCardClick,
  onExhaustCard,
  onFlipCard,
  onPickup,
  onTrash,
  onRecycle,
  onSetActiveBattleground,
  onUpdateTempMight,
}: BattlefieldZoneProps) {
  const opponent: PlayerSide = currentPlayer === "red" ? "blue" : "red";

  // All battlefield cards from both players
  const allCards = [...redCards, ...blueCards];

  // Battleground cards (the battlefield TYPE card) - each player picks one
  const redBattlegroundCards = redCards.filter(c => c.card?.cardType === "Battlefield");
  const blueBattlegroundCards = blueCards.filter(c => c.card?.cardType === "Battlefield");
  const opponentBattlegroundCards = currentPlayer === "red" ? blueBattlegroundCards : redBattlegroundCards;
  const currentBattlegroundCards = currentPlayer === "red" ? redBattlegroundCards : blueBattlegroundCards;

  // Unit cards split by which battlefield they're in (based on battlefieldSide)
  const allUnitCards = allCards.filter(c => c.card?.cardType !== "Battlefield");
  const opponentBattlefieldCards = allUnitCards.filter(c => c.battlefieldSide === opponent);
  const currentBattlefieldUnitCards = allUnitCards.filter(c => c.battlefieldSide === currentPlayer);

  // Further split each battlefield by card owner (for visual top/bottom separation)
  const opponentFieldOpponentCards = opponentBattlefieldCards.filter(c => c.playerSide === opponent);
  const opponentFieldCurrentCards = opponentBattlefieldCards.filter(c => c.playerSide === currentPlayer);
  const currentFieldOpponentCards = currentBattlefieldUnitCards.filter(c => c.playerSide === opponent);
  const currentFieldCurrentCards = currentBattlefieldUnitCards.filter(c => c.playerSide === currentPlayer);

  // Two droppable zones - anyone can drop into either
  const { isOver: isOverOpponent, setNodeRef: setOpponentRef } = useDroppable({
    id: `battlefield-${opponent}`,
  });
  const { isOver: isOverCurrent, setNodeRef: setCurrentRef } = useDroppable({
    id: `battlefield-${currentPlayer}`,
  });

  const renderCards = (cards: CardInstance[]) => (
    <div className="flex flex-wrap gap-1 p-1 h-[123px] overflow-auto justify-center items-start content-start">
      {cards.map((cardInstance) => {
        const isOwner = cardInstance.playerSide === currentPlayer;
        return (
          <BattlefieldCard
            key={cardInstance.cardInstanceId}
            cardInstance={cardInstance}
            currentPlayer={currentPlayer}
            onViewDetails={onCardClick}
            onExhaust={isOwner ? onExhaustCard : undefined}
            onFlip={isOwner ? onFlipCard : undefined}
            onPickup={isOwner ? onPickup : undefined}
            onTrash={isOwner ? onTrash : undefined}
            onRecycle={isOwner ? onRecycle : undefined}
            onUpdateTempMight={isOwner ? onUpdateTempMight : undefined}
          />
        );
      })}
    </div>
  );

  return (
    <div className="bg-board-zone rounded-lg border-2 border-board-border p-3">
      <div className="text-sm font-semibold text-center mb-3 text-gold">
        Battlefields
      </div>

      <div className="flex flex-row gap-3">
        {/* Opponent's battlefield (they picked the battleground card) */}
        <div className="flex-1 flex gap-2">
          <BattlegroundPile
            cards={opponentBattlegroundCards}
            activeCardInstanceId={opponent === "red" ? redActiveBattleground : blueActiveBattleground}
            isOwner={false}
            playerSide={opponent}
            onCardClick={onCardClick}
          />
          <div
            ref={setOpponentRef}
            className={`
              flex-1 rounded-lg border-2 flex flex-col
              border-gold/30 bg-board-bg/50
              ${isOverOpponent ? "border-gold bg-gold/10" : ""}
              transition-colors duration-200
            `}
          >
            {/* Opponent's cards on top */}
            {renderCards(opponentFieldOpponentCards)}
            <div className="border-t border-dashed border-gold/20 mx-2" />
            {/* Your cards on bottom */}
            {renderCards(opponentFieldCurrentCards)}
          </div>
        </div>

        {/* Current player's battlefield (you picked the battleground card) */}
        <div className="flex-1 flex gap-2">
          <div
            ref={setCurrentRef}
            className={`
              flex-1 rounded-lg border-2 flex flex-col
              border-gold/30 bg-board-bg/50
              ${isOverCurrent ? "border-gold bg-gold/10" : ""}
              transition-colors duration-200
            `}
          >
            {/* Opponent's cards on top */}
            {renderCards(currentFieldOpponentCards)}
            <div className="border-t border-dashed border-gold/20 mx-2" />
            {/* Your cards on bottom */}
            {renderCards(currentFieldCurrentCards)}
          </div>
          <BattlegroundPile
            cards={currentBattlegroundCards}
            activeCardInstanceId={currentPlayer === "red" ? redActiveBattleground : blueActiveBattleground}
            isOwner={true}
            playerSide={currentPlayer}
            onCardClick={onCardClick}
            onSetActiveBattleground={(cardInstanceId) => onSetActiveBattleground?.(currentPlayer, cardInstanceId)}
          />
        </div>
      </div>
    </div>
  );
}
