# Riftbound TCG Digital Board

A 2-player digital playing surface for Riftbound TCG built with Next.js, Tailwind CSS, and SQLite.

## Quick Reference

```bash
# Development
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint

# Database
npm run csv-to-json  # Convert cardlist.csv to cards.json
npm run seed-db      # Seed SQLite database from cards.json
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (uses `@import "tailwindcss"` syntax)
- **UI Components**: shadcn/ui (use `npx shadcn@latest add <component>` to add new components)
- **Database**: SQLite via `better-sqlite3`
- **Real-time**: Pusher (WebSockets)
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **TypeScript**: Strict mode enabled

### UI Patterns
- **Drawer for details**: Use the Drawer component (from shadcn/ui) for revealing additional information or detail views. Bottom drawer for content details (e.g., card details), right drawer for menus.
- **Color scheme**: Dark grays (`#1a1a1a`, `#262626`, `#404040`) with gold accents (`#c9a227`). Keep red/blue for player-specific elements.
- **Ctrl/Cmd+hover zoom**: Cards show a 500px tall zoomed image when hovering while holding Ctrl/Cmd key. Uses `CardWithZoom` wrapper component with shadcn Tooltip.

### Key Design Decisions
- **No game rules enforcement** - Just a digital playing surface, not a game engine
- **Repository pattern** - All DB access through interfaces (easy to swap SQLite for PostgreSQL)
- **Desktop only** - No responsive design, phone users can zoom
- **Real-time sync via Pusher** - All state changes broadcast `game_state_updated` event, clients re-fetch board state

## Project Structure

```
/cards
├── app/
│   ├── page.tsx                          # Home - create/join game
│   ├── board/[gameId]/page.tsx           # Main game board
│   └── api/games/[gameId]/
│       ├── board-state/route.ts          # GET board state
│       ├── move-card/route.ts            # POST move card between zones
│       ├── flip-card/route.ts            # POST toggle face up/down
│       ├── exhaust-card/route.ts         # POST toggle exhausted
│       ├── draw/route.ts                 # POST draw from deck
│       ├── shuffle/route.ts              # POST shuffle zone
│       ├── reset/route.ts                # POST reset game
│       ├── import-deck/route.ts          # POST import TTS deck list
│       └── load-starter-deck/route.ts    # GET list / POST load starter
├── components/
│   ├── board/
│   │   ├── GameBoard.tsx                 # Combines both player boards
│   │   ├── PlayerBoard.tsx               # Single player's zones
│   │   └── zones/                        # Individual zone components
│   ├── cards/
│   │   ├── Card.tsx                      # Card display
│   │   ├── CardStack.tsx                 # Deck/pile display
│   │   ├── CardDetailDrawer.tsx          # Bottom drawer with card details
│   │   └── CardZoomTooltip.tsx           # Ctrl/Cmd+hover zoom tooltip
│   └── ui/
│       └── DeckImporter.tsx              # Import modal with starter buttons
├── lib/
│   ├── db/
│   │   ├── index.ts                      # Database connection
│   │   └── schema.sql                    # Table definitions
│   ├── pusher/
│   │   ├── server.ts                     # Server-side Pusher (broadcasts)
│   │   └── client.ts                     # Client-side Pusher (receives)
│   ├── repositories/
│   │   ├── interfaces/                   # ICardRepository, IGameRepository, etc.
│   │   └── sqlite/                       # SQLite implementations
│   ├── data/
│   │   └── starterDecks.ts               # 4 pre-built starter decks
│   ├── types/
│   │   ├── card.ts                       # Card type definitions
│   │   ├── deck.ts                       # Deck/PlayerSide types
│   │   └── game.ts                       # ZoneType, BoardState, etc.
│   └── utils/
│       └── deckParser.ts                 # TTS format parser
├── hooks/
│   └── useGameUpdates.ts                 # Pusher subscription hook
├── scripts/
│   ├── csv-to-json.ts                    # Converts cardlist.csv → cards.json
│   └── seed-database.ts                  # Seeds DB from cards.json
├── data/
│   └── cards.json                        # Generated card data
└── resources/
    └── cardlist.csv                      # Source card data
```

## Board Layout

Each player has these zones:
- **Legend** - 1 card slot, face up
- **Champion** - 1 card slot, face up
- **Base** - Scrollable area for multiple cards
- **Battlefield** - Shared center zone, scrollable
- **Main Deck** - Card stack, face down
- **Trash** - Discard pile
- **Rune Deck** - Card stack for runes
- **Runes** - Channeled runes area
- **Hand** - Private to player, scrollable

## Zone Types

```typescript
type ZoneType =
  | "legend"
  | "champion"
  | "base"
  | "battlefield"
  | "main_deck"
  | "trash"
  | "rune_deck"
  | "runes"
  | "hand";
```

## Card Types

Cards are auto-sorted to zones based on their `cardType`:
- `Legend`, `Champion Legend` → legend zone
- `Champion Unit` → champion zone (first one), main_deck (extras)
- `Basic Rune` → rune_deck
- `Battlefield` → battlefield zone (displayed as landscape cards, cannot be exhausted)
- Everything else → main_deck

## Deck Import Format

TTS (Tabletop Simulator) format: space-separated codes like `OGN-007-1`
- Format: `{SET}-{NUMBER}-{QUANTITY}`
- Example: `OGN-007-1 OGN-039-2 OGS-001-3`

Card prefixes (e.g., `OGN-007`) are matched to database IDs (e.g., `OGN-007/298`).

## Starter Decks

4 pre-built decks available via quick-load buttons:
- **Annie** (Fury) - Fire damage, aggressive
- **Lux** (Mind) - Spell synergies, card draw
- **Garen** (Order) - Strong units, combat buffs
- **Master Yi** (Calm) - Defensive, counter-play

Defined in `/lib/data/starterDecks.ts`.

## Database Schema

Key tables:
- `cards` - Card library (from CSV)
- `games` - Game sessions
- `board_state` - Card positions per game

## Repository Pattern

All database access goes through interfaces:

```typescript
// Get repositories
import { getCardRepository, getGameRepository } from "@/lib/repositories";

const cardRepo = getCardRepository();
const gameRepo = getGameRepository();

// Example usage
const card = await cardRepo.findById("OGN-007/298");
const boardState = await gameRepo.getBoardState(gameId, "red");
```

## URL Structure

- `/` - Home page (create game)
- `/board/[gameId]?player=red` - Red player's view
- `/board/[gameId]?player=blue` - Blue player's view

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/games` | POST | Create new game |
| `/api/games/[gameId]/board-state` | GET | Get both players' board states |
| `/api/games/[gameId]/move-card` | POST | Move card between zones |
| `/api/games/[gameId]/flip-card` | POST | Toggle card face up/down |
| `/api/games/[gameId]/exhaust-card` | POST | Toggle card exhausted |
| `/api/games/[gameId]/draw` | POST | Draw card from deck to hand |
| `/api/games/[gameId]/shuffle` | POST | Shuffle a zone |
| `/api/games/[gameId]/reset` | POST | Reset game to initial state |
| `/api/games/[gameId]/import-deck` | POST | Import TTS format deck |
| `/api/games/[gameId]/load-starter-deck` | GET/POST | List or load starter deck |

## Opponent Board Flip

Toggle "Flip opponent's board" checkbox applies `transform: rotate(180deg)` via inline style to the opponent's board section.

## Common Tasks

### Add a new starter deck

Edit `/lib/data/starterDecks.ts`:
```typescript
{
  id: "new-deck",
  name: "New Deck Name",
  champion: "Champion Name",
  description: "Deck description",
  cards: [
    ["OGN-XXX", 1],  // [cardPrefix, quantity]
    // ...
  ],
}
```

Then add a button in `/components/ui/DeckImporter.tsx` in the `STARTER_DECKS` array.

### Add a new zone type

1. Add to `ZoneType` in `/lib/types/game.ts`
2. Add to `BoardState.zones` initialization
3. Create zone component in `/components/board/zones/`
4. Add to `PlayerBoard.tsx` layout
5. Update `emptyBoardState` in board page

### Modify card auto-sorting

Edit the switch statement in:
- `/app/api/games/[gameId]/import-deck/route.ts`
- `/app/api/games/[gameId]/load-starter-deck/route.ts`

## Real-time Updates (Pusher)

Uses Pusher for real-time sync between players (EU cluster).

### Server-side (broadcast updates)
```typescript
import { broadcastGameUpdate } from "@/lib/pusher/server";

// After any state change in API route:
await broadcastGameUpdate(gameId);
```

### Client-side (receive updates)
```typescript
import { useGameUpdates } from "@/hooks/useGameUpdates";

// In component:
useGameUpdates(gameId, () => {
  // Re-fetch board state when update received
  fetchBoardState();
});
```

### Files
- `/lib/pusher/server.ts` - Server-side Pusher instance (broadcasts events)
- `/lib/pusher/client.ts` - Client-side Pusher instance (receives events)
- `/hooks/useGameUpdates.ts` - React hook for subscribing to game updates

### Channel/Event naming
- Channel: `game-{gameId}`
- Event: `game_state_updated`

## Tailwind v4 Notes

This project uses Tailwind CSS v4 which has different config:
- Uses `@import "tailwindcss"` in globals.css (not @tailwind directives)
- Uses `@tailwindcss/postcss` plugin in postcss.config.js
- Theme extends via CSS variables in globals.css

## Card Interactions

| Action | Trigger | Effect |
|--------|---------|--------|
| View details | Single click | Opens bottom drawer with card info |
| Flip card | Double click | Toggles face up/down |
| Exhaust/ready | Right click | Toggles exhausted state (rotates card) |
| Zoom preview | Ctrl/Cmd + hover | Shows 500px tall card image tooltip |
| Move card | Drag and drop | Moves card to target zone |

## Score Tracker

- Displayed in toolbar between player names
- Format: `Red 0 : 0 Blue`
- Left-click on a score to increment (max 9)
- Right-click on a score to decrement (min 0)
- Gold ring appears when a player reaches 9 (victory)
