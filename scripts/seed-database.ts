/**
 * Database Seeding Script
 *
 * Usage: npm run seed-db
 *
 * This script:
 * 1. Initializes the SQLite database
 * 2. Imports cards from /data/cards.json
 */

import * as fs from "fs";
import * as path from "path";
import Database from "better-sqlite3";

interface Card {
  id: string;
  game: string;
  setName: string;
  cardNumber: string;
  cardName: string;
  energy: number | null;
  might: number | null;
  domain: string | null;
  cardType: string;
  tags: string[];
  ability: string | null;
  rarity: string;
  artist: string | null;
  imageUrl: string | null;
}

async function main() {
  const dbPath = path.join(process.cwd(), "data", "riftbound.db");
  const cardsJsonPath = path.join(process.cwd(), "data", "cards.json");
  const schemaPath = path.join(process.cwd(), "lib", "db", "schema.sql");

  console.log("Database path:", dbPath);

  // Ensure data directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Delete existing database to start fresh
  if (fs.existsSync(dbPath)) {
    console.log("Removing existing database...");
    fs.unlinkSync(dbPath);
  }

  // Initialize database
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Run schema
  console.log("Creating schema...");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schema);

  // Load cards from JSON
  if (!fs.existsSync(cardsJsonPath)) {
    console.error("Error: cards.json not found. Run 'npm run csv-to-json' first.");
    process.exit(1);
  }

  console.log("Loading cards from JSON...");
  const cardsJson = fs.readFileSync(cardsJsonPath, "utf-8");
  const cards: Card[] = JSON.parse(cardsJson);

  // Prepare insert statement
  const insertCard = db.prepare(`
    INSERT INTO cards (
      id, game, set_name, card_number, card_name, energy, might,
      domain, card_type, tags, ability, rarity, artist, image_url
    ) VALUES (
      @id, @game, @setName, @cardNumber, @cardName, @energy, @might,
      @domain, @cardType, @tags, @ability, @rarity, @artist, @imageUrl
    )
  `);

  // Insert all cards in a transaction
  console.log(`Inserting ${cards.length} cards...`);
  const insertMany = db.transaction((cards: Card[]) => {
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

  // Verify
  const count = db.prepare("SELECT COUNT(*) as count FROM cards").get() as { count: number };
  console.log(`\nDatabase seeded successfully with ${count.count} cards.`);

  // Show sample
  const sample = db.prepare("SELECT card_name, card_type, domain FROM cards LIMIT 5").all();
  console.log("\nSample cards:");
  sample.forEach((card: unknown) => {
    const c = card as { card_name: string; card_type: string; domain: string };
    console.log(`  - ${c.card_name} (${c.card_type}, ${c.domain || "no domain"})`);
  });

  db.close();
  console.log("\nDone!");
}

main().catch(console.error);
