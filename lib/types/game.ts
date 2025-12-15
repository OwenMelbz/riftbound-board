import type { Card } from "./card";
import type { PlayerSide } from "./deck";

export type GameStatus = "active" | "completed" | "abandoned";

export type ZoneType =
  | "legend"
  | "champion"
  | "base"
  | "battlefield"
  | "main_deck"
  | "trash"
  | "rune_deck"
  | "runes"
  | "hand";

export interface Game {
  id: string;
  status: GameStatus;
  redDeckId: string | null;
  blueDeckId: string | null;
  redActiveBattleground: string | null;
  blueActiveBattleground: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardInstance {
  id: string;
  gameId: string;
  playerSide: PlayerSide;
  zoneType: ZoneType;
  cardInstanceId: string;
  cardId: string;
  position: number;
  isFaceUp: boolean;
  isExhausted: boolean;
  battlefieldSide?: PlayerSide; // Which battlefield the card is on (red's or blue's)
  tempMight?: number | null; // Temporary might modifier (buff/debuff)
  card?: Card;
}

export interface BoardState {
  gameId: string;
  playerSide: PlayerSide;
  zones: Record<ZoneType, CardInstance[]>;
}

export interface CardMoveDTO {
  cardInstanceId: string;
  fromZone: ZoneType;
  toZone: ZoneType;
  toPlayerSide?: PlayerSide;
  position?: number;
  battlefieldSide?: PlayerSide; // Which battlefield to place on (red's or blue's)
}

export interface CreateGameDTO {
  id?: string;
  redDeckId?: string;
  blueDeckId?: string;
}
