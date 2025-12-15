import { getDatabase } from "@/lib/db";
import { SQLiteCardRepository } from "./sqlite/CardRepository";
import { SQLiteDeckRepository } from "./sqlite/DeckRepository";
import { SQLiteGameRepository } from "./sqlite/GameRepository";
import type { ICardRepository } from "./interfaces/ICardRepository";
import type { IDeckRepository } from "./interfaces/IDeckRepository";
import type { IGameRepository } from "./interfaces/IGameRepository";

export type DatabaseType = "sqlite" | "postgresql";

// Singleton instances
let cardRepository: ICardRepository | null = null;
let deckRepository: IDeckRepository | null = null;
let gameRepository: IGameRepository | null = null;

export function getCardRepository(): ICardRepository {
  if (!cardRepository) {
    cardRepository = new SQLiteCardRepository(getDatabase());
  }
  return cardRepository;
}

export function getDeckRepository(): IDeckRepository {
  if (!deckRepository) {
    deckRepository = new SQLiteDeckRepository(getDatabase());
  }
  return deckRepository;
}

export function getGameRepository(): IGameRepository {
  if (!gameRepository) {
    gameRepository = new SQLiteGameRepository(getDatabase());
  }
  return gameRepository;
}

// For future: Support multiple database types
export function createRepositories(type: DatabaseType = "sqlite") {
  const db = getDatabase();

  switch (type) {
    case "sqlite":
      return {
        cards: new SQLiteCardRepository(db),
        decks: new SQLiteDeckRepository(db),
        games: new SQLiteGameRepository(db),
      };
    case "postgresql":
      throw new Error("PostgreSQL not yet implemented");
    default:
      throw new Error(`Unknown database type: ${type}`);
  }
}

// Re-export interfaces
export type { ICardRepository } from "./interfaces/ICardRepository";
export type { IDeckRepository } from "./interfaces/IDeckRepository";
export type { IGameRepository } from "./interfaces/IGameRepository";
