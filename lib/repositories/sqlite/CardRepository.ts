import type { Database } from "better-sqlite3";
import type { ICardRepository } from "../interfaces/ICardRepository";
import type { Card, CardFilters, CardType, Domain } from "@/lib/types";

interface CardRow {
  id: string;
  game: string;
  set_name: string;
  card_number: string;
  card_name: string;
  energy: number | null;
  might: number | null;
  domain: string | null;
  card_type: string;
  tags: string | null;
  ability: string | null;
  rarity: string;
  artist: string | null;
  image_url: string | null;
}

function rowToCard(row: CardRow): Card {
  return {
    id: row.id,
    game: row.game,
    setName: row.set_name,
    cardNumber: row.card_number,
    cardName: row.card_name,
    energy: row.energy,
    might: row.might,
    domain: row.domain as Domain | null,
    cardType: row.card_type as CardType,
    tags: row.tags ? JSON.parse(row.tags) : [],
    ability: row.ability,
    rarity: row.rarity as Card["rarity"],
    artist: row.artist,
    imageUrl: row.image_url,
  };
}

export class SQLiteCardRepository implements ICardRepository {
  constructor(private db: Database) {}

  async findAll(filters?: CardFilters): Promise<Card[]> {
    let query = "SELECT * FROM cards WHERE 1=1";
    const params: (string | number)[] = [];

    if (filters?.type) {
      query += " AND card_type = ?";
      params.push(filters.type);
    }

    if (filters?.domain) {
      query += " AND domain = ?";
      params.push(filters.domain);
    }

    if (filters?.rarity) {
      query += " AND rarity = ?";
      params.push(filters.rarity);
    }

    if (filters?.search) {
      query += " AND (card_name LIKE ? OR ability LIKE ? OR tags LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY card_name ASC";

    const rows = this.db.prepare(query).all(...params) as CardRow[];
    return rows.map(rowToCard);
  }

  async findById(id: string): Promise<Card | null> {
    const row = this.db
      .prepare("SELECT * FROM cards WHERE id = ?")
      .get(id) as CardRow | undefined;

    return row ? rowToCard(row) : null;
  }

  async findByType(cardType: CardType): Promise<Card[]> {
    const rows = this.db
      .prepare("SELECT * FROM cards WHERE card_type = ? ORDER BY card_name ASC")
      .all(cardType) as CardRow[];

    return rows.map(rowToCard);
  }

  async findByDomain(domain: Domain): Promise<Card[]> {
    const rows = this.db
      .prepare("SELECT * FROM cards WHERE domain = ? ORDER BY card_name ASC")
      .all(domain) as CardRow[];

    return rows.map(rowToCard);
  }

  async search(query: string): Promise<Card[]> {
    const searchTerm = `%${query}%`;
    const rows = this.db
      .prepare(
        `SELECT * FROM cards
         WHERE card_name LIKE ? OR ability LIKE ? OR tags LIKE ?
         ORDER BY card_name ASC`
      )
      .all(searchTerm, searchTerm, searchTerm) as CardRow[];

    return rows.map(rowToCard);
  }

  async count(): Promise<number> {
    const result = this.db
      .prepare("SELECT COUNT(*) as count FROM cards")
      .get() as { count: number };

    return result.count;
  }
}
