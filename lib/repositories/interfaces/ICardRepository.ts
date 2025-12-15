import type { Card, CardFilters, CardType, Domain } from "@/lib/types";

export interface ICardRepository {
  findAll(filters?: CardFilters): Promise<Card[]>;
  findById(id: string): Promise<Card | null>;
  findByType(cardType: CardType): Promise<Card[]>;
  findByDomain(domain: Domain): Promise<Card[]>;
  search(query: string): Promise<Card[]>;
  count(): Promise<number>;
}
