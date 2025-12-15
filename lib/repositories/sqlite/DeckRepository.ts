import type { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import type { IDeckRepository } from "../interfaces/IDeckRepository";
import type { Deck, DeckWithCards, CreateDeckDTO, UpdateDeckDTO, DeckCard, Card } from "@/lib/types";
import type { PlayerSide } from "@/lib/types/deck";

interface DeckRow {
  id: string;
  name: string;
  player_side: string | null;
  champion_legend_id: string | null;
  chosen_champion_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DeckCardRow {
  id: string;
  deck_id: string;
  card_id: string;
  quantity: number;
}

function rowToDeck(row: DeckRow): Deck {
  return {
    id: row.id,
    name: row.name,
    playerSide: row.player_side as PlayerSide | null,
    championLegendId: row.champion_legend_id,
    chosenChampionId: row.chosen_champion_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SQLiteDeckRepository implements IDeckRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<Deck[]> {
    const rows = this.db
      .prepare("SELECT * FROM decks ORDER BY created_at DESC")
      .all() as DeckRow[];

    return rows.map(rowToDeck);
  }

  async findById(id: string): Promise<Deck | null> {
    const row = this.db
      .prepare("SELECT * FROM decks WHERE id = ?")
      .get(id) as DeckRow | undefined;

    return row ? rowToDeck(row) : null;
  }

  async findByIdWithCards(id: string): Promise<DeckWithCards | null> {
    const deck = await this.findById(id);
    if (!deck) return null;

    // Get main deck cards
    const mainDeckRows = this.db
      .prepare(
        `SELECT dc.*, c.* FROM deck_cards dc
         JOIN cards c ON dc.card_id = c.id
         WHERE dc.deck_id = ?`
      )
      .all(id) as (DeckCardRow & { card_name: string })[];

    // Get rune cards
    const runeRows = this.db
      .prepare(
        `SELECT dr.*, c.* FROM deck_runes dr
         JOIN cards c ON dr.card_id = c.id
         WHERE dr.deck_id = ?`
      )
      .all(id) as (DeckCardRow & { card_name: string })[];

    // Get champion legend
    let championLegend: Card | null = null;
    if (deck.championLegendId) {
      const legendRow = this.db
        .prepare("SELECT * FROM cards WHERE id = ?")
        .get(deck.championLegendId);
      if (legendRow) {
        championLegend = this.rowToCard(legendRow);
      }
    }

    // Get chosen champion
    let chosenChampion: Card | null = null;
    if (deck.chosenChampionId) {
      const champRow = this.db
        .prepare("SELECT * FROM cards WHERE id = ?")
        .get(deck.chosenChampionId);
      if (champRow) {
        chosenChampion = this.rowToCard(champRow);
      }
    }

    return {
      ...deck,
      championLegend,
      chosenChampion,
      mainDeckCards: mainDeckRows.map((row) => ({
        id: row.id,
        deckId: row.deck_id,
        cardId: row.card_id,
        quantity: row.quantity,
      })),
      runeCards: runeRows.map((row) => ({
        id: row.id,
        deckId: row.deck_id,
        cardId: row.card_id,
        quantity: row.quantity,
      })),
    };
  }

  async create(dto: CreateDeckDTO): Promise<Deck> {
    const id = uuidv4();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO decks (id, name, player_side, champion_legend_id, chosen_champion_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        dto.name,
        dto.playerSide || null,
        dto.championLegendId || null,
        dto.chosenChampionId || null,
        now,
        now
      );

    // Add main deck cards
    if (dto.mainDeckCardIds) {
      const insertCard = this.db.prepare(
        "INSERT INTO deck_cards (id, deck_id, card_id, quantity) VALUES (?, ?, ?, ?)"
      );
      for (const { cardId, quantity } of dto.mainDeckCardIds) {
        insertCard.run(uuidv4(), id, cardId, quantity);
      }
    }

    // Add rune cards
    if (dto.runeCardIds) {
      const insertRune = this.db.prepare(
        "INSERT INTO deck_runes (id, deck_id, card_id, quantity) VALUES (?, ?, ?, ?)"
      );
      for (const { cardId, quantity } of dto.runeCardIds) {
        insertRune.run(uuidv4(), id, cardId, quantity);
      }
    }

    return (await this.findById(id))!;
  }

  async update(id: string, dto: UpdateDeckDTO): Promise<Deck | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: (string | null)[] = [];

    if (dto.name !== undefined) {
      updates.push("name = ?");
      params.push(dto.name);
    }
    if (dto.playerSide !== undefined) {
      updates.push("player_side = ?");
      params.push(dto.playerSide || null);
    }
    if (dto.championLegendId !== undefined) {
      updates.push("champion_legend_id = ?");
      params.push(dto.championLegendId || null);
    }
    if (dto.chosenChampionId !== undefined) {
      updates.push("chosen_champion_id = ?");
      params.push(dto.chosenChampionId || null);
    }

    if (updates.length > 0) {
      updates.push("updated_at = ?");
      params.push(new Date().toISOString());
      params.push(id);

      this.db
        .prepare(`UPDATE decks SET ${updates.join(", ")} WHERE id = ?`)
        .run(...params);
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = this.db.prepare("DELETE FROM decks WHERE id = ?").run(id);
    return result.changes > 0;
  }

  async addCard(deckId: string, cardId: string, quantity: number): Promise<void> {
    // Check if card already exists in deck
    const existing = this.db
      .prepare("SELECT * FROM deck_cards WHERE deck_id = ? AND card_id = ?")
      .get(deckId, cardId) as DeckCardRow | undefined;

    if (existing) {
      this.db
        .prepare("UPDATE deck_cards SET quantity = quantity + ? WHERE id = ?")
        .run(quantity, existing.id);
    } else {
      this.db
        .prepare("INSERT INTO deck_cards (id, deck_id, card_id, quantity) VALUES (?, ?, ?, ?)")
        .run(uuidv4(), deckId, cardId, quantity);
    }
  }

  async removeCard(deckId: string, cardId: string): Promise<void> {
    this.db
      .prepare("DELETE FROM deck_cards WHERE deck_id = ? AND card_id = ?")
      .run(deckId, cardId);
  }

  async addRune(deckId: string, cardId: string, quantity: number): Promise<void> {
    const existing = this.db
      .prepare("SELECT * FROM deck_runes WHERE deck_id = ? AND card_id = ?")
      .get(deckId, cardId) as DeckCardRow | undefined;

    if (existing) {
      this.db
        .prepare("UPDATE deck_runes SET quantity = quantity + ? WHERE id = ?")
        .run(quantity, existing.id);
    } else {
      this.db
        .prepare("INSERT INTO deck_runes (id, deck_id, card_id, quantity) VALUES (?, ?, ?, ?)")
        .run(uuidv4(), deckId, cardId, quantity);
    }
  }

  async removeRune(deckId: string, cardId: string): Promise<void> {
    this.db
      .prepare("DELETE FROM deck_runes WHERE deck_id = ? AND card_id = ?")
      .run(deckId, cardId);
  }

  private rowToCard(row: unknown): Card {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      game: r.game as string,
      setName: r.set_name as string,
      cardNumber: r.card_number as string,
      cardName: r.card_name as string,
      energy: r.energy as number | null,
      might: r.might as number | null,
      domain: r.domain as Card["domain"],
      cardType: r.card_type as Card["cardType"],
      tags: r.tags ? JSON.parse(r.tags as string) : [],
      ability: r.ability as string | null,
      rarity: r.rarity as Card["rarity"],
      artist: r.artist as string | null,
      imageUrl: r.image_url as string | null,
    };
  }
}
