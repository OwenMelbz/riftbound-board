/**
 * CSV to JSON Conversion Script for Riftbound Card List
 *
 * Usage: npm run csv-to-json
 *
 * This script reads the cardlist.csv from /resources and outputs
 * a structured JSON file to /data/cards.json
 *
 * The script handles:
 * - Quoted fields with commas (e.g., tags like "Dragon, Noxus")
 * - Empty fields
 * - Special characters in ability text
 */

import * as fs from "fs";
import * as path from "path";

interface RawCard {
  Game: string;
  Set: string;
  "Card Number": string;
  "Card Name": string;
  Energy: string;
  Might: string;
  Domain: string;
  "Card Type": string;
  Tags: string;
  Ability: string;
  Rarity: string;
  Artist: string;
  "Image URL": string;
}

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

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseTags(tagsStr: string): string[] {
  if (!tagsStr || tagsStr.trim() === "") {
    return [];
  }

  // Tags are comma-separated within the field
  return tagsStr
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function parseNumber(value: string): number | null {
  if (!value || value.trim() === "") {
    return null;
  }
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

function convertCard(raw: Record<string, string>): Card {
  return {
    id: raw["Card Number"],
    game: raw["Game"],
    setName: raw["Set"],
    cardNumber: raw["Card Number"],
    cardName: raw["Card Name"],
    energy: parseNumber(raw["Energy"]),
    might: parseNumber(raw["Might"]),
    domain: raw["Domain"] || null,
    cardType: raw["Card Type"],
    tags: parseTags(raw["Tags"]),
    ability: raw["Ability"] || null,
    rarity: raw["Rarity"],
    artist: raw["Artist"] || null,
    imageUrl: raw["Image URL"] || null,
  };
}

async function main() {
  const inputPath = path.join(process.cwd(), "resources", "cardlist.csv");
  const outputPath = path.join(process.cwd(), "data", "cards.json");

  console.log("Reading CSV from:", inputPath);

  if (!fs.existsSync(inputPath)) {
    console.error("Error: cardlist.csv not found at", inputPath);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(inputPath, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    console.error("Error: CSV file appears to be empty or malformed");
    process.exit(1);
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  console.log("Headers found:", headers);

  // Parse data rows
  const cards: Card[] = [];
  const errors: { line: number; error: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);

      if (values.length !== headers.length) {
        errors.push({
          line: i + 1,
          error: `Column count mismatch: expected ${headers.length}, got ${values.length}`,
        });
        continue;
      }

      const rawCard: Record<string, string> = {};
      headers.forEach((header, idx) => {
        rawCard[header] = values[idx];
      });

      const card = convertCard(rawCard);
      cards.push(card);
    } catch (err) {
      errors.push({
        line: i + 1,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Report results
  console.log(`\nProcessed ${cards.length} cards successfully`);

  if (errors.length > 0) {
    console.log(`\nWarnings (${errors.length} rows with issues):`);
    errors.slice(0, 10).forEach((e) => {
      console.log(`  Line ${e.line}: ${e.error}`);
    });
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more`);
    }
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2));
  console.log(`\nOutput written to: ${outputPath}`);

  // Summary statistics
  const cardTypes = new Map<string, number>();
  const domains = new Map<string, number>();

  cards.forEach((card) => {
    cardTypes.set(card.cardType, (cardTypes.get(card.cardType) || 0) + 1);
    if (card.domain) {
      domains.set(card.domain, (domains.get(card.domain) || 0) + 1);
    }
  });

  console.log("\nCard Types:");
  Array.from(cardTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  console.log("\nDomains:");
  Array.from(domains.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count}`);
    });
}

main().catch(console.error);
