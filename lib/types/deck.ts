import type { Card } from "./card";

export interface Deck {
  id: string;
  name: string;
  playerSide: PlayerSide | null;
  championLegendId: string | null;
  chosenChampionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeckWithCards extends Deck {
  championLegend: Card | null;
  chosenChampion: Card | null;
  mainDeckCards: DeckCard[];
  runeCards: DeckCard[];
}

export interface DeckCard {
  id: string;
  deckId: string;
  cardId: string;
  quantity: number;
  card?: Card;
}

export interface CreateDeckDTO {
  name: string;
  playerSide?: PlayerSide;
  championLegendId?: string;
  chosenChampionId?: string;
  mainDeckCardIds?: { cardId: string; quantity: number }[];
  runeCardIds?: { cardId: string; quantity: number }[];
}

export interface UpdateDeckDTO {
  name?: string;
  playerSide?: PlayerSide;
  championLegendId?: string;
  chosenChampionId?: string;
}

export type PlayerSide = "red" | "blue";
