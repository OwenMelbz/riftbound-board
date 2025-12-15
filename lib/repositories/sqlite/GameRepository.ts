import type { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import type { IGameRepository } from "../interfaces/IGameRepository";
import type {
  Game,
  GameStatus,
  BoardState,
  CardInstance,
  CardMoveDTO,
  CreateGameDTO,
  ZoneType,
  Card,
} from "@/lib/types";
import type { PlayerSide } from "@/lib/types/deck";

interface GameRow {
  id: string;
  status: string;
  red_deck_id: string | null;
  blue_deck_id: string | null;
  red_active_battleground: string | null;
  blue_active_battleground: string | null;
  created_at: string;
  updated_at: string;
}

interface BoardStateRow {
  id: string;
  game_id: string;
  player_side: string;
  zone_type: string;
  card_instance_id: string;
  card_id: string;
  position: number;
  is_face_up: number;
  is_exhausted: number;
  battlefield_side: string | null;
  temp_might: number | null;
}

function rowToGame(row: GameRow): Game {
  return {
    id: row.id,
    status: row.status as GameStatus,
    redDeckId: row.red_deck_id,
    blueDeckId: row.blue_deck_id,
    redActiveBattleground: row.red_active_battleground,
    blueActiveBattleground: row.blue_active_battleground,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToCardInstance(row: BoardStateRow, card?: Card): CardInstance {
  return {
    id: row.id,
    gameId: row.game_id,
    playerSide: row.player_side as PlayerSide,
    zoneType: row.zone_type as ZoneType,
    cardInstanceId: row.card_instance_id,
    cardId: row.card_id,
    position: row.position,
    isFaceUp: row.is_face_up === 1,
    isExhausted: row.is_exhausted === 1,
    battlefieldSide: row.battlefield_side as PlayerSide | undefined,
    tempMight: row.temp_might,
    card,
  };
}

export class SQLiteGameRepository implements IGameRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Game | null> {
    const row = this.db
      .prepare("SELECT * FROM games WHERE id = ?")
      .get(id) as GameRow | undefined;

    return row ? rowToGame(row) : null;
  }

  async findActive(): Promise<Game[]> {
    const rows = this.db
      .prepare("SELECT * FROM games WHERE status = 'active' ORDER BY created_at DESC")
      .all() as GameRow[];

    return rows.map(rowToGame);
  }

  async create(dto: CreateGameDTO): Promise<Game> {
    const id = dto.id || uuidv4();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO games (id, status, red_deck_id, blue_deck_id, created_at, updated_at)
         VALUES (?, 'active', ?, ?, ?, ?)`
      )
      .run(id, dto.redDeckId || null, dto.blueDeckId || null, now, now);

    return (await this.findById(id))!;
  }

  async updateStatus(id: string, status: GameStatus): Promise<void> {
    this.db
      .prepare("UPDATE games SET status = ?, updated_at = ? WHERE id = ?")
      .run(status, new Date().toISOString(), id);
  }

  async delete(id: string): Promise<boolean> {
    const result = this.db.prepare("DELETE FROM games WHERE id = ?").run(id);
    return result.changes > 0;
  }

  async getBoardState(gameId: string, playerSide: PlayerSide): Promise<BoardState> {
    const rows = this.db
      .prepare(
        `SELECT bs.*, c.* FROM board_state bs
         JOIN cards c ON bs.card_id = c.id
         WHERE bs.game_id = ? AND bs.player_side = ?
         ORDER BY bs.zone_type, bs.position`
      )
      .all(gameId, playerSide) as (BoardStateRow & Record<string, unknown>)[];

    const zones: Record<ZoneType, CardInstance[]> = {
      legend: [],
      champion: [],
      base: [],
      battlefield: [],
      main_deck: [],
      trash: [],
      rune_deck: [],
      runes: [],
      hand: [],
    };

    for (const row of rows) {
      const card = this.rowToCard(row);
      const instance = rowToCardInstance(row, card);
      zones[instance.zoneType].push(instance);
    }

    return {
      gameId,
      playerSide,
      zones,
    };
  }

  async getFullBoardState(gameId: string): Promise<{ red: BoardState; blue: BoardState }> {
    const red = await this.getBoardState(gameId, "red");
    const blue = await this.getBoardState(gameId, "blue");
    return { red, blue };
  }

  async getZone(
    gameId: string,
    playerSide: PlayerSide,
    zone: ZoneType
  ): Promise<CardInstance[]> {
    const rows = this.db
      .prepare(
        `SELECT bs.*, c.* FROM board_state bs
         JOIN cards c ON bs.card_id = c.id
         WHERE bs.game_id = ? AND bs.player_side = ? AND bs.zone_type = ?
         ORDER BY bs.position`
      )
      .all(gameId, playerSide, zone) as (BoardStateRow & Record<string, unknown>)[];

    return rows.map((row) => rowToCardInstance(row, this.rowToCard(row)));
  }

  async addCardToZone(
    gameId: string,
    playerSide: PlayerSide,
    zone: ZoneType,
    cardId: string,
    options?: { isFaceUp?: boolean; position?: number; isExhausted?: boolean }
  ): Promise<CardInstance> {
    const id = uuidv4();
    const cardInstanceId = uuidv4();
    const position =
      options?.position ??
      (await this.getNextPosition(gameId, playerSide, zone));

    this.db
      .prepare(
        `INSERT INTO board_state
         (id, game_id, player_side, zone_type, card_instance_id, card_id, position, is_face_up, is_exhausted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        gameId,
        playerSide,
        zone,
        cardInstanceId,
        cardId,
        position,
        options?.isFaceUp ? 1 : 0,
        options?.isExhausted ? 1 : 0
      );

    const row = this.db
      .prepare(
        `SELECT bs.*, c.* FROM board_state bs
         JOIN cards c ON bs.card_id = c.id
         WHERE bs.id = ?`
      )
      .get(id) as BoardStateRow & Record<string, unknown>;

    return rowToCardInstance(row, this.rowToCard(row));
  }

  async moveCard(
    gameId: string,
    playerSide: PlayerSide,
    move: CardMoveDTO
  ): Promise<void> {
    const position =
      move.position ?? (await this.getNextPosition(gameId, playerSide, move.toZone));

    // Never change card ownership - only update zone, position, and battlefield_side
    this.db
      .prepare(
        `UPDATE board_state
         SET zone_type = ?, position = ?, battlefield_side = ?
         WHERE game_id = ? AND card_instance_id = ?`
      )
      .run(move.toZone, position, move.battlefieldSide ?? null, gameId, move.cardInstanceId);

    // If moving to battlefield, reorder cards alphabetically by card name
    if (move.toZone === "battlefield") {
      await this.reorderBattlefieldAlphabetically(gameId, playerSide);
    }
  }

  async reorderBattlefieldAlphabetically(
    gameId: string,
    playerSide: PlayerSide
  ): Promise<void> {
    // Get all battlefield cards with their card names, excluding Battlefield type cards (battleground cards)
    const cards = this.db
      .prepare(
        `SELECT bs.id, c.card_name, c.card_type FROM board_state bs
         JOIN cards c ON bs.card_id = c.id
         WHERE bs.game_id = ? AND bs.player_side = ? AND bs.zone_type = 'battlefield'
         ORDER BY c.card_name ASC`
      )
      .all(gameId, playerSide) as { id: string; card_name: string; card_type: string }[];

    // Separate battleground cards (keep at end) from unit cards (sort alphabetically)
    const battlegroundCards = cards.filter(c => c.card_type === "Battlefield");
    const unitCards = cards.filter(c => c.card_type !== "Battlefield");

    // Update positions: unit cards first (alphabetically), then battleground cards
    const updateStmt = this.db.prepare(
      "UPDATE board_state SET position = ? WHERE id = ?"
    );

    const updateAll = this.db.transaction(() => {
      unitCards.forEach((card, i) => {
        updateStmt.run(i, card.id);
      });
      battlegroundCards.forEach((card, i) => {
        updateStmt.run(unitCards.length + i, card.id);
      });
    });

    updateAll();
  }

  async flipCard(gameId: string, cardInstanceId: string): Promise<void> {
    this.db
      .prepare(
        `UPDATE board_state
         SET is_face_up = CASE WHEN is_face_up = 1 THEN 0 ELSE 1 END
         WHERE game_id = ? AND card_instance_id = ?`
      )
      .run(gameId, cardInstanceId);
  }

  async exhaustCard(gameId: string, cardInstanceId: string): Promise<void> {
    this.db
      .prepare(
        `UPDATE board_state
         SET is_exhausted = CASE WHEN is_exhausted = 1 THEN 0 ELSE 1 END
         WHERE game_id = ? AND card_instance_id = ?`
      )
      .run(gameId, cardInstanceId);
  }

  async updateTempMight(
    gameId: string,
    cardInstanceId: string,
    tempMight: number | null
  ): Promise<void> {
    this.db
      .prepare(
        `UPDATE board_state
         SET temp_might = ?
         WHERE game_id = ? AND card_instance_id = ?`
      )
      .run(tempMight, gameId, cardInstanceId);
  }

  async removeCard(gameId: string, cardInstanceId: string): Promise<void> {
    this.db
      .prepare("DELETE FROM board_state WHERE game_id = ? AND card_instance_id = ?")
      .run(gameId, cardInstanceId);
  }

  async initializeBoardFromDeck(
    gameId: string,
    playerSide: PlayerSide,
    deckId: string
  ): Promise<void> {
    // Get deck with cards
    const deck = this.db
      .prepare("SELECT * FROM decks WHERE id = ?")
      .get(deckId) as { champion_legend_id: string | null; chosen_champion_id: string | null } | undefined;

    if (!deck) {
      throw new Error(`Deck ${deckId} not found`);
    }

    // Add champion legend to legend zone
    if (deck.champion_legend_id) {
      await this.addCardToZone(gameId, playerSide, "legend", deck.champion_legend_id, {
        isFaceUp: true,
      });
    }

    // Add chosen champion to champion zone
    if (deck.chosen_champion_id) {
      await this.addCardToZone(gameId, playerSide, "champion", deck.chosen_champion_id, {
        isFaceUp: true,
      });
    }

    // Add main deck cards (face down in deck)
    const mainDeckCards = this.db
      .prepare("SELECT * FROM deck_cards WHERE deck_id = ?")
      .all(deckId) as { card_id: string; quantity: number }[];

    for (const { card_id, quantity } of mainDeckCards) {
      for (let i = 0; i < quantity; i++) {
        await this.addCardToZone(gameId, playerSide, "main_deck", card_id, {
          isFaceUp: false,
        });
      }
    }

    // Shuffle the main deck
    await this.shuffleZone(gameId, playerSide, "main_deck");

    // Add rune cards (face down in rune deck)
    const runeCards = this.db
      .prepare("SELECT * FROM deck_runes WHERE deck_id = ?")
      .all(deckId) as { card_id: string; quantity: number }[];

    for (const { card_id, quantity } of runeCards) {
      for (let i = 0; i < quantity; i++) {
        await this.addCardToZone(gameId, playerSide, "rune_deck", card_id, {
          isFaceUp: false,
        });
      }
    }

    // Shuffle the rune deck
    await this.shuffleZone(gameId, playerSide, "rune_deck");
  }

  async resetGame(gameId: string): Promise<void> {
    // Clear all board state for this game
    this.db.prepare("DELETE FROM board_state WHERE game_id = ?").run(gameId);

    // Update game status
    this.db
      .prepare("UPDATE games SET updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), gameId);
  }

  async drawCard(
    gameId: string,
    playerSide: PlayerSide,
    fromDeck: "main_deck" | "rune_deck"
  ): Promise<CardInstance | null> {
    // Get the top card from the deck (highest position = top)
    // Use bs.id as board_state_id to avoid collision with cards.id
    const topCard = this.db
      .prepare(
        `SELECT bs.id as board_state_id, bs.*, c.* FROM board_state bs
         JOIN cards c ON bs.card_id = c.id
         WHERE bs.game_id = ? AND bs.player_side = ? AND bs.zone_type = ?
         ORDER BY bs.position DESC
         LIMIT 1`
      )
      .get(gameId, playerSide, fromDeck) as (BoardStateRow & Record<string, unknown> & { board_state_id: string }) | undefined;

    if (!topCard) {
      return null;
    }

    // Determine destination zone: rune_deck -> runes, main_deck -> hand
    const targetZone = fromDeck === "rune_deck" ? "runes" : "hand";

    // Get next position before running the update
    const nextPosition = await this.getNextPosition(gameId, playerSide, targetZone);

    // Move to target zone, face up
    this.db
      .prepare(
        `UPDATE board_state
         SET zone_type = ?, is_face_up = 1, position = ?
         WHERE id = ?`
      )
      .run(targetZone, nextPosition, topCard.board_state_id);

    // Return updated card
    const updated = this.db
      .prepare(
        `SELECT bs.id as board_state_id, bs.*, c.* FROM board_state bs
         JOIN cards c ON bs.card_id = c.id
         WHERE bs.id = ?`
      )
      .get(topCard.board_state_id) as (BoardStateRow & Record<string, unknown> & { board_state_id: string });

    // Fix the id field for rowToCardInstance
    updated.id = updated.board_state_id;

    return rowToCardInstance(updated, this.rowToCard(updated));
  }

  async peekCard(
    gameId: string,
    playerSide: PlayerSide,
    fromDeck: "main_deck" | "rune_deck"
  ): Promise<CardInstance | null> {
    // Get the top card from the deck (highest position = top)
    const topCard = this.db
      .prepare(
        `SELECT bs.*, c.* FROM board_state bs
         JOIN cards c ON bs.card_id = c.id
         WHERE bs.game_id = ? AND bs.player_side = ? AND bs.zone_type = ?
         ORDER BY bs.position DESC
         LIMIT 1`
      )
      .get(gameId, playerSide, fromDeck) as (BoardStateRow & Record<string, unknown>) | undefined;

    if (!topCard) {
      return null;
    }

    return rowToCardInstance(topCard, this.rowToCard(topCard));
  }

  async recycleRune(
    gameId: string,
    playerSide: PlayerSide,
    cardInstanceId: string
  ): Promise<void> {
    // Get the minimum position in the rune deck (bottom of deck)
    const result = this.db
      .prepare(
        `SELECT MIN(position) as min_pos FROM board_state
         WHERE game_id = ? AND player_side = ? AND zone_type = 'rune_deck'`
      )
      .get(gameId, playerSide) as { min_pos: number | null };

    const bottomPosition = (result.min_pos ?? 0) - 1;

    // Move the rune from runes zone to bottom of rune_deck, reset face down and not exhausted
    this.db
      .prepare(
        `UPDATE board_state
         SET zone_type = 'rune_deck', position = ?, is_face_up = 0, is_exhausted = 0
         WHERE game_id = ? AND card_instance_id = ?`
      )
      .run(bottomPosition, gameId, cardInstanceId);
  }

  async recycleHand(
    gameId: string,
    playerSide: PlayerSide,
    cardInstanceId: string
  ): Promise<void> {
    // Get the minimum position in the main deck (bottom of deck)
    const result = this.db
      .prepare(
        `SELECT MIN(position) as min_pos FROM board_state
         WHERE game_id = ? AND player_side = ? AND zone_type = 'main_deck'`
      )
      .get(gameId, playerSide) as { min_pos: number | null };

    const bottomPosition = (result.min_pos ?? 0) - 1;

    // Move the card from hand to bottom of main_deck, set face down
    this.db
      .prepare(
        `UPDATE board_state
         SET zone_type = 'main_deck', position = ?, is_face_up = 0, is_exhausted = 0
         WHERE game_id = ? AND card_instance_id = ?`
      )
      .run(bottomPosition, gameId, cardInstanceId);
  }

  async recycleTrash(
    gameId: string,
    playerSide: PlayerSide
  ): Promise<void> {
    // Get all cards in the trash
    const trashCards = this.db
      .prepare(
        `SELECT card_instance_id FROM board_state
         WHERE game_id = ? AND player_side = ? AND zone_type = 'trash'`
      )
      .all(gameId, playerSide) as { card_instance_id: string }[];

    if (trashCards.length === 0) return;

    // Get the minimum position in the main deck (bottom of deck)
    const result = this.db
      .prepare(
        `SELECT MIN(position) as min_pos FROM board_state
         WHERE game_id = ? AND player_side = ? AND zone_type = 'main_deck'`
      )
      .get(gameId, playerSide) as { min_pos: number | null };

    let bottomPosition = (result.min_pos ?? 0) - 1;

    // Move all trash cards to bottom of main_deck, face down, not exhausted
    const updateStmt = this.db.prepare(
      `UPDATE board_state
       SET zone_type = 'main_deck', position = ?, is_face_up = 0, is_exhausted = 0
       WHERE game_id = ? AND card_instance_id = ?`
    );

    const moveAll = this.db.transaction(() => {
      for (const card of trashCards) {
        updateStmt.run(bottomPosition, gameId, card.card_instance_id);
        bottomPosition--;
      }
    });

    moveAll();
  }

  async recycleBattlefield(
    gameId: string,
    playerSide: PlayerSide,
    cardInstanceId: string
  ): Promise<void> {
    // Get the minimum position in the main deck (bottom of deck)
    const result = this.db
      .prepare(
        `SELECT MIN(position) as min_pos FROM board_state
         WHERE game_id = ? AND player_side = ? AND zone_type = 'main_deck'`
      )
      .get(gameId, playerSide) as { min_pos: number | null };

    const bottomPosition = (result.min_pos ?? 0) - 1;

    // Move the card from battlefield to bottom of main_deck, face down, not exhausted
    this.db
      .prepare(
        `UPDATE board_state
         SET zone_type = 'main_deck', position = ?, is_face_up = 0, is_exhausted = 0
         WHERE game_id = ? AND card_instance_id = ?`
      )
      .run(bottomPosition, gameId, cardInstanceId);
  }

  async shuffleZone(
    gameId: string,
    playerSide: PlayerSide,
    zone: ZoneType
  ): Promise<void> {
    // Get all cards in the zone
    const cards = this.db
      .prepare(
        `SELECT id FROM board_state
         WHERE game_id = ? AND player_side = ? AND zone_type = ?`
      )
      .all(gameId, playerSide, zone) as { id: string }[];

    // Fisher-Yates shuffle for positions
    const positions = cards.map((_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Update positions
    const updateStmt = this.db.prepare(
      "UPDATE board_state SET position = ? WHERE id = ?"
    );

    const updateMany = this.db.transaction(() => {
      cards.forEach((card, i) => {
        updateStmt.run(positions[i], card.id);
      });
    });

    updateMany();
  }

  private async getNextPosition(
    gameId: string,
    playerSide: PlayerSide,
    zone: ZoneType
  ): Promise<number> {
    const result = this.db
      .prepare(
        `SELECT MAX(position) as max_pos FROM board_state
         WHERE game_id = ? AND player_side = ? AND zone_type = ?`
      )
      .get(gameId, playerSide, zone) as { max_pos: number | null };

    return (result.max_pos ?? -1) + 1;
  }

  async setActiveBattleground(
    gameId: string,
    playerSide: PlayerSide,
    cardInstanceId: string | null
  ): Promise<void> {
    const column = playerSide === "red" ? "red_active_battleground" : "blue_active_battleground";
    this.db
      .prepare(`UPDATE games SET ${column} = ?, updated_at = ? WHERE id = ?`)
      .run(cardInstanceId, new Date().toISOString(), gameId);
  }

  async getActiveBattlegrounds(gameId: string): Promise<{ red: string | null; blue: string | null }> {
    const row = this.db
      .prepare("SELECT red_active_battleground, blue_active_battleground FROM games WHERE id = ?")
      .get(gameId) as { red_active_battleground: string | null; blue_active_battleground: string | null } | undefined;

    return {
      red: row?.red_active_battleground ?? null,
      blue: row?.blue_active_battleground ?? null,
    };
  }

  async setScore(
    gameId: string,
    playerSide: PlayerSide,
    score: number
  ): Promise<void> {
    const column = playerSide === "red" ? "red_score" : "blue_score";
    this.db
      .prepare(`UPDATE games SET ${column} = ?, updated_at = ? WHERE id = ?`)
      .run(score, new Date().toISOString(), gameId);
  }

  async getScores(gameId: string): Promise<{ red: number; blue: number }> {
    const row = this.db
      .prepare("SELECT red_score, blue_score FROM games WHERE id = ?")
      .get(gameId) as { red_score: number | null; blue_score: number | null } | undefined;

    return {
      red: row?.red_score ?? 0,
      blue: row?.blue_score ?? 0,
    };
  }

  private rowToCard(row: Record<string, unknown>): Card {
    return {
      id: row.card_id as string,
      game: row.game as string,
      setName: row.set_name as string,
      cardNumber: row.card_number as string,
      cardName: row.card_name as string,
      energy: row.energy as number | null,
      might: row.might as number | null,
      domain: row.domain as Card["domain"],
      cardType: row.card_type as Card["cardType"],
      tags: row.tags ? JSON.parse(row.tags as string) : [],
      ability: row.ability as string | null,
      rarity: row.rarity as Card["rarity"],
      artist: row.artist as string | null,
      imageUrl: row.image_url as string | null,
    };
  }
}
