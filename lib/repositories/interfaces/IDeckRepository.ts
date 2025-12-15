import type { Deck, DeckWithCards, CreateDeckDTO, UpdateDeckDTO } from "@/lib/types";

export interface IDeckRepository {
  findAll(): Promise<Deck[]>;
  findById(id: string): Promise<Deck | null>;
  findByIdWithCards(id: string): Promise<DeckWithCards | null>;
  create(deck: CreateDeckDTO): Promise<Deck>;
  update(id: string, deck: UpdateDeckDTO): Promise<Deck | null>;
  delete(id: string): Promise<boolean>;
  addCard(deckId: string, cardId: string, quantity: number): Promise<void>;
  removeCard(deckId: string, cardId: string): Promise<void>;
  addRune(deckId: string, cardId: string, quantity: number): Promise<void>;
  removeRune(deckId: string, cardId: string): Promise<void>;
}
