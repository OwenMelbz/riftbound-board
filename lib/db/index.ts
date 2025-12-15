import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "data", "riftbound.db");
    const dbDir = path.dirname(dbPath);

    // Ensure data directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    // Run migrations/schema on first connection
    initializeSchema(db);
  }

  return db;
}

function initializeSchema(database: Database.Database): void {
  const schemaPath = path.join(process.cwd(), "lib", "db", "schema.sql");

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf-8");
    database.exec(schema);
  }

  // Run migrations for existing tables
  runMigrations(database);

  // Seed cards if table is empty
  seedCardsIfEmpty(database);
}

function seedCardsIfEmpty(database: Database.Database): void {
  const count = database.prepare("SELECT COUNT(*) as count FROM cards").get() as { count: number };

  if (count.count > 0) {
    return; // Already seeded
  }

  const cardsJsonPath = path.join(process.cwd(), "data", "cards.json");

  if (!fs.existsSync(cardsJsonPath)) {
    console.warn("Warning: cards.json not found. Run 'npm run csv-to-json' to generate it.");
    return;
  }

  console.log("Seeding cards from cards.json...");
  const cardsJson = fs.readFileSync(cardsJsonPath, "utf-8");
  const cards = JSON.parse(cardsJson);

  const insertCard = database.prepare(`
    INSERT INTO cards (
      id, game, set_name, card_number, card_name, energy, might,
      domain, card_type, tags, ability, rarity, artist, image_url
    ) VALUES (
      @id, @game, @setName, @cardNumber, @cardName, @energy, @might,
      @domain, @cardType, @tags, @ability, @rarity, @artist, @imageUrl
    )
  `);

  const insertMany = database.transaction((cards: Array<Record<string, unknown>>) => {
    for (const card of cards) {
      insertCard.run({
        id: card.id,
        game: card.game,
        setName: card.setName,
        cardNumber: card.cardNumber,
        cardName: card.cardName,
        energy: card.energy,
        might: card.might,
        domain: card.domain,
        cardType: card.cardType,
        tags: JSON.stringify(card.tags),
        ability: card.ability,
        rarity: card.rarity,
        artist: card.artist,
        imageUrl: card.imageUrl,
      });
    }
  });

  insertMany(cards);
  console.log(`Seeded ${cards.length} cards.`);
}

function runMigrations(database: Database.Database): void {
  // Check if temp_might column exists in board_state
  const boardStateColumns = database
    .prepare("PRAGMA table_info(board_state)")
    .all() as { name: string }[];

  const hasTempMight = boardStateColumns.some((col) => col.name === "temp_might");

  if (!hasTempMight) {
    database.exec("ALTER TABLE board_state ADD COLUMN temp_might INTEGER DEFAULT NULL");
  }

  // Check if active_battleground columns exist in games
  const gamesColumns = database
    .prepare("PRAGMA table_info(games)")
    .all() as { name: string }[];

  const hasRedActiveBattleground = gamesColumns.some((col) => col.name === "red_active_battleground");
  const hasBlueActiveBattleground = gamesColumns.some((col) => col.name === "blue_active_battleground");

  if (!hasRedActiveBattleground) {
    database.exec("ALTER TABLE games ADD COLUMN red_active_battleground TEXT");
  }
  if (!hasBlueActiveBattleground) {
    database.exec("ALTER TABLE games ADD COLUMN blue_active_battleground TEXT");
  }

  // Check if score columns exist in games
  const hasRedScore = gamesColumns.some((col) => col.name === "red_score");
  const hasBlueScore = gamesColumns.some((col) => col.name === "blue_score");

  if (!hasRedScore) {
    database.exec("ALTER TABLE games ADD COLUMN red_score INTEGER DEFAULT 0");
  }
  if (!hasBlueScore) {
    database.exec("ALTER TABLE games ADD COLUMN blue_score INTEGER DEFAULT 0");
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// For testing - reset database connection
export function resetDatabase(): void {
  closeDatabase();
}
