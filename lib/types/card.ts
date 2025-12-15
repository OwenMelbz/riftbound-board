export type Domain =
  | "Fury"
  | "Calm"
  | "Mind"
  | "Body"
  | "Chaos"
  | "Order"
  | "Colorless";

export type CardType =
  | "Unit"
  | "Champion Unit"
  | "Spell"
  | "Gear"
  | "Basic Rune"
  | "Legend"
  | "Champion Legend"
  | "Signature Spell"
  | "Signature Unit"
  | "Token Unit"
  | "Battlefield";

export type Rarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Showcase";

export interface Card {
  id: string;
  game: string;
  setName: string;
  cardNumber: string;
  cardName: string;
  energy: number | null;
  might: number | null;
  domain: Domain | null;
  cardType: CardType;
  tags: string[];
  ability: string | null;
  rarity: Rarity;
  artist: string | null;
  imageUrl: string | null;
}

export interface CardFilters {
  type?: CardType;
  domain?: Domain;
  rarity?: Rarity;
  search?: string;
}
