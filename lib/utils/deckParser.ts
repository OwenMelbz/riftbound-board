/**
 * Parse TTS (Tabletop Simulator) deck format
 *
 * Format: "{SET}-{NUMBER}-{QUANTITY}" separated by spaces
 * Example: "OGN-007-1 OGN-039-2 OGN-027-1"
 *
 * The -1, -2 at the end is the quantity
 * The card ID prefix (e.g., OGN-007) needs to be matched to database IDs (e.g., OGN-007/298)
 */

export interface ParsedDeckCard {
  cardPrefix: string;  // e.g., "OGN-007"
  quantity: number;
}

export interface ParsedDeck {
  cards: ParsedDeckCard[];
  errors: string[];
}

export function parseTTSDeckList(input: string): ParsedDeck {
  const cards: ParsedDeckCard[] = [];
  const errors: string[] = [];

  // Split by whitespace and filter empty strings
  const tokens = input.trim().split(/\s+/).filter(t => t.length > 0);

  for (const token of tokens) {
    // Match pattern: SET-NUMBER-QUANTITY (e.g., OGN-007-1, OGS-017-1)
    const match = token.match(/^([A-Z]{3}-\d{3}[a-z]?)-(\d+)$/i);

    if (!match) {
      errors.push(`Invalid format: "${token}" - expected format like "OGN-007-1"`);
      continue;
    }

    const cardPrefix = match[1].toUpperCase();
    const quantity = parseInt(match[2], 10);

    if (quantity < 1 || quantity > 10) {
      errors.push(`Invalid quantity for ${cardPrefix}: ${quantity}`);
      continue;
    }

    // Check if we already have this card, if so add to quantity
    const existing = cards.find(c => c.cardPrefix === cardPrefix);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cards.push({ cardPrefix, quantity });
    }
  }

  return { cards, errors };
}

/**
 * Categorize cards by type for deck building
 */
export interface CategorizedDeck {
  legend: ParsedDeckCard | null;
  champion: ParsedDeckCard | null;
  mainDeck: ParsedDeckCard[];
  runeDeck: ParsedDeckCard[];
  battlefield: ParsedDeckCard | null;
  unknown: ParsedDeckCard[];
}
