# Riftbound TCG Digital Board

A digital playing surface for the Riftbound trading card game. This is not a game engine - it's a virtual tabletop that lets two players manage cards, zones, and game state in real-time.

## Features

- Two-player board with all standard zones (Legend, Champion, Base, Battlefield, Hand, Deck, Trash, Runes)
- Drag-and-drop card movement
- Real-time sync between players via Pusher
- Card flip, exhaust, and buff/debuff tracking
- Deck import (TTS format)
- Score tracking
- Ctrl+hover card zoom

## Requirements

- Node.js 18+
- npm

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repo-url> riftbound-board
cd riftbound-board
npm install
```

### 2. Set up environment variables

Copy the example environment file and add your Pusher credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Pusher credentials from https://dashboard.pusher.com/:

```
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

### 3. Start the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## How to Play

1. Open the app in two browser windows (or on two devices)
2. One player selects **Red**, the other selects **Blue**
3. Each player imports their deck via the menu
4. Play!

### Controls

- **Drag & drop** - Move cards between zones
- **Right-click** - Context menu with actions
- **Ctrl/Cmd + hover** - Zoom card preview
- **E** (while hovering) - Exhaust/ready card
- **F** (while hovering) - Flip card
- **Space** (while hovering) - View card details
- **Score** - Left-click to increment, right-click to decrement

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- SQLite (better-sqlite3)
- Pusher (real-time sync)
- @dnd-kit (drag and drop)
- shadcn/ui components

## Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   └── board/[gameId]/    # Game board page
├── components/
│   ├── board/             # Board and zone components
│   ├── cards/             # Card display components
│   └── ui/                # UI components (shadcn)
├── lib/
│   ├── db/                # Database setup and schema
│   ├── pusher/            # Real-time sync
│   ├── repositories/      # Data access layer
│   └── types/             # TypeScript types
├── data/                  # Card data and SQLite database
└── public/                # Static assets (card backs, etc.)
```

## Playing with a Friend

To play with someone on a different network, you can use [ngrok](https://ngrok.com/) to expose your local server:

```bash
ngrok http 3000
```

Share the generated URL with your friend. One of you plays as Red, the other as Blue.

## License

MIT
