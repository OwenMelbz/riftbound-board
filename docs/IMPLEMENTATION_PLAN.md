# Riftbound TCG Digital Board - Implementation Plan

> **Note**: This plan is also saved in the project at `/docs/IMPLEMENTATION_PLAN.md` for future sessions.

## Overview

A 2-player digital board for Riftbound TCG using Next.js, Tailwind CSS, and SQLite with a repository pattern. No game state management - just a playing surface with card zones.

## Board Layout (Per Player)

Based on the reference image at `/resources/board layout.jpeg`:

```
┌─────────────────────────────────────────────────────────────────┐
│                              │ [Legend Zone] │ [Champion Zone]  │
│        (Logo/Title)          │   (1 slot)    │    (1 slot)      │
├──────────────────────────────┴───────────────┼──────────────────┤
│                                              │                  │
│              [Base Zone]                     │    [Deck]        │
│         (scrollable, multi-card)             │  (card stack)    │
│                                              │                  │
│                                              │    [Trash]       │
│                                              │ (discard pile)   │
├──────────────────────────────────────────────┼──────────────────┤
│  [Rune Deck]  │     [Runes Zone]             │                  │
│ (card stack)  │  (channeled runes)           │                  │
├─────────────────────────────────────────────────────────────────┤
│                        [Hand Zone]                              │
│            (scrollable, private to player)                      │
└─────────────────────────────────────────────────────────────────┘
```

**Battlefield Zone**: Shared center area between both players (scrollable)

**Hand Zone**:
- Scrollable area at bottom of each player's board
- Only visible to the owning player (hidden from opponent)
- Cards drawn from deck go here

## Project Structure

```
/cards/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Player selection (Red/Blue)
│   ├── board/[gameId]/page.tsx     # Main board view
│   └── api/
│       ├── cards/route.ts
│       ├── decks/[...]/route.ts
│       ├── games/[...]/route.ts
│       └── board-state/route.ts
├── components/
│   ├── board/
│   │   ├── GameBoard.tsx
│   │   ├── PlayerBoard.tsx
│   │   └── zones/
│   │       ├── LegendZone.tsx
│   │       ├── ChampionZone.tsx
│   │       ├── BaseZone.tsx
│   │       ├── BattlefieldZone.tsx
│   │       ├── MainDeckZone.tsx
│   │       ├── TrashZone.tsx
│   │       ├── RuneDeckZone.tsx
│   │       ├── RunesZone.tsx
│       └── HandZone.tsx            # Private hand (only visible to owner)
│   ├── cards/
│   │   ├── Card.tsx
│   │   ├── CardStack.tsx
│   │   └── CardDetailModal.tsx
│   └── ui/
│       ├── PlayerSelector.tsx
│       ├── DeckImporter.tsx
│       ├── GameControls.tsx
│       └── OrientationToggle.tsx  # Toggle to flip opponent's board
├── lib/
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.sql
│   ├── repositories/
│   │   ├── interfaces/
│   │   │   ├── ICardRepository.ts
│   │   │   ├── IDeckRepository.ts
│   │   │   └── IGameRepository.ts
│   │   ├── sqlite/
│   │   │   ├── CardRepository.ts
│   │   │   ├── DeckRepository.ts
│   │   │   └── GameRepository.ts
│   │   └── index.ts               # Repository factory
│   └── types/
│       ├── card.ts
│       ├── deck.ts
│       └── game.ts
├── scripts/
│   ├── csv-to-json.ts             # Reusable CSV converter
│   └── seed-database.ts
├── data/
│   └── cards.json                 # Generated from CSV
└── resources/                     # Existing (cardlist.csv, rules)
```

## Database Schema

```sql
-- Card Library (from CSV)
CREATE TABLE cards (
    id TEXT PRIMARY KEY,
    game TEXT NOT NULL,
    set_name TEXT NOT NULL,
    card_number TEXT NOT NULL,
    card_name TEXT NOT NULL,
    energy INTEGER,
    might INTEGER,
    domain TEXT,
    card_type TEXT NOT NULL,
    tags TEXT,                    -- JSON array
    ability TEXT,
    rarity TEXT,
    artist TEXT,
    image_url TEXT
);

-- Saved Decks
CREATE TABLE decks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    player_side TEXT,
    champion_legend_id TEXT,
    chosen_champion_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deck_cards (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE TABLE deck_runes (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

-- Game Sessions
CREATE TABLE games (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'active',
    red_deck_id TEXT,
    blue_deck_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Board State
-- zone_type: legend, champion, base, battlefield, main_deck, trash, rune_deck, runes, hand
CREATE TABLE board_state (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    player_side TEXT NOT NULL,
    zone_type TEXT NOT NULL,
    card_instance_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    is_face_up BOOLEAN DEFAULT 0,
    is_exhausted BOOLEAN DEFAULT 0,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);
```

## Repository Pattern

### Interface Example
```typescript
// lib/repositories/interfaces/ICardRepository.ts
export interface ICardRepository {
  findAll(filters?: CardFilters): Promise<Card[]>;
  findById(id: string): Promise<Card | null>;
  findByType(cardType: CardType): Promise<Card[]>;
  search(query: string): Promise<Card[]>;
}
```

### Factory Pattern
```typescript
// lib/repositories/index.ts
export function getCardRepository(): ICardRepository {
  return new SQLiteCardRepository(getDatabase());
}
// Easy to swap: return new PostgresCardRepository(pool);
```

## Implementation Steps

### Phase 1: Project Setup
1. Initialize Next.js with TypeScript and Tailwind
2. Install dependencies: `better-sqlite3`, `uuid`, `@dnd-kit/core`, `@dnd-kit/sortable`
3. Create type definitions in `/lib/types/`

### Phase 2: Data Layer
4. Create CSV-to-JSON conversion script (`/scripts/csv-to-json.ts`)
   - Parse `/resources/cardlist.csv`
   - Handle quoted fields with commas
   - Output to `/data/cards.json`
5. Set up SQLite database with schema
6. Implement repository interfaces
7. Implement SQLite repositories
8. Create database seeding script

### Phase 3: API Routes
9. Cards API - GET endpoints with filtering
10. Decks API - CRUD operations, deck import
11. Games API - session management, board state
12. Board State API - card movement, flip, exhaust

### Phase 4: UI Components
13. Card components (Card, CardStack, CardDetailModal)
14. Zone components (all 8 zones)
15. Set up drag-and-drop with @dnd-kit

### Phase 5: Board Assembly
16. PlayerBoard component (layout per player, includes Hand zone)
17. GameBoard component (combines both players + battlefield)
18. Player selection page (Red/Blue choice)
19. Orientation toggle button (CSS `transform: rotate(180deg)` on opponent board)

### Phase 6: Features
20. Deck import functionality
21. Game reset functionality
22. Card interactions (view, flip, exhaust, move)
23. Hand visibility logic (only show own hand, hide opponent's)

## Card Types (from CSV analysis)
- Unit
- Champion Unit
- Spell
- Gear
- Basic Rune
- Legend
- Champion Legend
- Signature Spell
- Signature Unit
- Token Unit
- Battlefield

## Domains
- Fury
- Calm
- Mind
- Body
- Chaos
- Order
- Colorless (multi-domain)

## Key Dependencies
- `next` - React framework
- `tailwindcss` - Styling
- `better-sqlite3` - SQLite database
- `@dnd-kit/core` + `@dnd-kit/sortable` - Drag and drop
- `uuid` - Unique IDs

## Critical Files
1. `/lib/repositories/interfaces/IGameRepository.ts` - Core board state interface
2. `/components/board/PlayerBoard.tsx` - Main layout component
3. `/lib/types/card.ts` - Card type definitions
4. `/scripts/csv-to-json.ts` - CSV conversion script
5. `/components/board/zones/BaseZone.tsx` - Scrollable zone pattern

---

## Decisions Log

This section tracks key decisions made during development. Update this when decisions are made.

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-12-14 | Use SQLite with repository pattern | Easy local development, swappable to PostgreSQL later |
| 2024-12-14 | Use @dnd-kit for drag-and-drop | Better performance and TypeScript support than alternatives |
| 2024-12-14 | No responsive design | Desktop only, phone users can zoom |
| 2024-12-14 | Hand zone private to owner | Cards drawn to hand, only visible to owning player |
| 2024-12-14 | Orientation toggle via CSS | Simple `transform: rotate(180deg)` to flip opponent board |
| 2024-12-14 | No game rules enforcement | Just a digital playing surface, not a game engine |

---

## Development Guidelines

### DO NOT:
- Run `npm run dev` or start dev servers without explicit request
- Run `npm run build` or production builds without explicit request
- Automatically start any long-running processes
- Push to git without explicit request

### DO:
- Run type checking (`tsc --noEmit`) to verify code
- Run linting if configured
- Run individual test files if needed
- Always ask before starting servers or builds
