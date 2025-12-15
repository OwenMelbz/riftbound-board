/**
 * Starter Decks for Riftbound TCG
 *
 * Format: Array of [cardPrefix, quantity] tuples
 * Card prefixes are matched to database IDs (e.g., "OGN-007" matches "OGN-007/298")
 */

export interface StarterDeck {
  id: string;
  name: string;
  champion: string;
  description: string;
  cards: [string, number][];  // [cardPrefix, quantity]
}

export const starterDecks: StarterDeck[] = [
  {
    id: "annie",
    name: "Annie Starter",
    champion: "Annie",
    description: "Fury deck focused on fire damage and aggressive play",
    cards: [
      // Legend & Champion
      ["OGS-017", 1],  // Annie Legend
      ["OGS-001", 2],  // Annie, Fiery (Champion)
      // Battlefield
      ["OGN-296", 1],
      // Main Deck - Units
      ["OGN-169", 3],
      ["OGN-170", 3],
      ["OGN-171", 3],
      ["OGN-185", 3],
      ["OGN-013", 2],
      ["OGS-011", 2],
      ["OGN-176", 3],
      ["OGS-010", 2],
      ["OGN-191", 3],
      ["OGN-174", 3],
      // Main Deck - Spells
      ["OGS-003", 3],  // Incinerate
      ["OGN-005", 3],
      ["OGS-002", 3],  // Firestorm
      ["OGS-018", 2],
      // Rune Deck
      ["OGN-007", 6],  // Fury Rune
      ["OGN-166", 6],  // Body Rune
    ],
  },
  {
    id: "lux",
    name: "Lux Starter",
    champion: "Lux",
    description: "Mind deck with spell synergies and card draw",
    cards: [
      // Legend & Champion
      ["OGS-021", 1],  // Lux Legend
      ["OGN-105", 3],  // Lux Champion
      // Battlefield
      ["OGN-288", 1],
      // Main Deck - Units
      ["OGN-095", 3],
      ["OGN-103", 3],
      ["OGN-210", 3],
      ["OGN-084", 2],
      ["OGN-087", 3],
      ["OGN-206", 3],
      ["OGS-014", 2],
      ["OGN-219", 3],
      ["OGS-006", 2],
      ["OGS-016", 3],
      ["OGS-012", 3],
      ["OGN-088", 2],
      ["OGS-022", 2],
      // Main Deck - Spells
      ["OGN-085", 3],
      // Rune Deck
      ["OGN-089", 6],  // Mind Rune
      ["OGN-214", 6],  // Order Rune
    ],
  },
  {
    id: "garen",
    name: "Garen Starter",
    champion: "Garen",
    description: "Order deck with strong units and combat buffs",
    cards: [
      // Legend & Champion
      ["OGS-023", 1],  // Garen Legend
      ["OGS-015", 3],  // Garen Champion
      // Battlefield
      ["OGN-294", 1],
      // Main Deck - Units
      ["OGN-210", 3],
      ["OGN-129", 3],
      ["OGN-130", 3],
      ["OGN-132", 3],
      ["OGN-211", 3],
      ["OGN-222", 3],
      ["OGN-206", 3],
      ["OGN-219", 3],
      ["OGN-131", 2],
      ["OGN-215", 2],
      ["OGS-024", 2],
      ["OGS-007", 2],
      ["OGS-013", 2],
      ["OGS-016", 3],
      // Rune Deck
      ["OGN-126", 6],  // Body Rune (Order version)
      ["OGN-214", 6],  // Order Rune
    ],
  },
  {
    id: "yi",
    name: "Master Yi Starter",
    champion: "Master Yi",
    description: "Calm deck with defensive options and counter-play",
    cards: [
      // Legend & Champion
      ["OGS-019", 1],  // Master Yi Legend
      ["OGS-004", 2],  // Yi, Meditative (Champion)
      // Battlefield
      ["OGN-279", 1],
      // Main Deck - Units
      ["OGN-046", 3],
      ["OGN-048", 3],
      ["OGN-052", 3],
      ["OGN-127", 3],
      ["OGN-134", 3],
      ["OGN-129", 2],
      ["OGN-055", 3],
      ["OGS-020", 2],
      ["OGS-005", 3],  // Zephyr Sage
      ["OGS-008", 3],
      ["OGN-137", 3],
      ["OGS-009", 2],
      ["OGN-142", 2],
      // Main Deck - Spells
      ["OGN-049", 3],
      // Rune Deck
      ["OGN-042", 6],  // Calm Rune
      ["OGN-126", 6],  // Body Rune
    ],
  },
];

export function getStarterDeck(id: string): StarterDeck | undefined {
  return starterDecks.find(d => d.id === id);
}
