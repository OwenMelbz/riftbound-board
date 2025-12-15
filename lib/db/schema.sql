-- Riftbound TCG Database Schema

-- Card Library (populated from CSV, read-only at runtime)
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    game TEXT NOT NULL,
    set_name TEXT NOT NULL,
    card_number TEXT NOT NULL,
    card_name TEXT NOT NULL,
    energy INTEGER,
    might INTEGER,
    domain TEXT,
    card_type TEXT NOT NULL,
    tags TEXT,
    ability TEXT,
    rarity TEXT,
    artist TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(card_type);
CREATE INDEX IF NOT EXISTS idx_cards_domain ON cards(domain);
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(card_name);

-- Saved Decks
CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    player_side TEXT CHECK(player_side IN ('red', 'blue')),
    champion_legend_id TEXT,
    chosen_champion_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (champion_legend_id) REFERENCES cards(id),
    FOREIGN KEY (chosen_champion_id) REFERENCES cards(id)
);

-- Main Deck Contents
CREATE TABLE IF NOT EXISTS deck_cards (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id)
);

-- Rune Deck Contents
CREATE TABLE IF NOT EXISTS deck_runes (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id)
);

-- Game Sessions
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'abandoned')),
    red_deck_id TEXT,
    blue_deck_id TEXT,
    red_active_battleground TEXT,
    blue_active_battleground TEXT,
    red_score INTEGER DEFAULT 0,
    blue_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (red_deck_id) REFERENCES decks(id),
    FOREIGN KEY (blue_deck_id) REFERENCES decks(id)
);

-- Board State (cards in zones)
CREATE TABLE IF NOT EXISTS board_state (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    player_side TEXT NOT NULL CHECK(player_side IN ('red', 'blue')),
    zone_type TEXT NOT NULL CHECK(zone_type IN ('legend', 'champion', 'base', 'battlefield', 'main_deck', 'trash', 'rune_deck', 'runes', 'hand')),
    card_instance_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    is_face_up INTEGER DEFAULT 0,
    is_exhausted INTEGER DEFAULT 0,
    battlefield_side TEXT CHECK(battlefield_side IN ('red', 'blue')),
    temp_might INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id)
);

CREATE INDEX IF NOT EXISTS idx_board_state_game ON board_state(game_id);
CREATE INDEX IF NOT EXISTS idx_board_state_zone ON board_state(game_id, player_side, zone_type);

-- Migration: Add temp_might column if it doesn't exist
-- SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we use a pragma check
-- This is handled in the initializeSchema function instead
