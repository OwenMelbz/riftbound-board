"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GameBoard } from "@/components/board";
import { CardWithZoom, CardZoomProvider } from "@/components/cards";
import { DeckImporter } from "@/components/ui/DeckImporter";
import { ScoreTracker } from "@/components/ui/ScoreTracker";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useGameUpdates } from "@/hooks/useGameUpdates";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { BoardState, ZoneType, Card } from "@/lib/types";
import type { PlayerSide } from "@/lib/types/deck";

// Empty board state for initialization
const emptyBoardState = (playerSide: PlayerSide, gameId: string): BoardState => ({
  gameId,
  playerSide,
  zones: {
    legend: [],
    champion: [],
    base: [],
    battlefield: [],
    main_deck: [],
    trash: [],
    rune_deck: [],
    runes: [],
    hand: [],
  },
});

export default function BoardPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const gameId = params.gameId as string;
  const currentPlayer = (searchParams.get("player") || "red") as PlayerSide;

  const [redBoardState, setRedBoardState] = useState<BoardState>(
    emptyBoardState("red", gameId)
  );
  const [blueBoardState, setBlueBoardState] = useState<BoardState>(
    emptyBoardState("blue", gameId)
  );
  const [invertOpponent, setInvertOpponent] = useState(true);
  const [showDeckImporter, setShowDeckImporter] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [showTokenDrawer, setShowTokenDrawer] = useState(false);
  const [tokenCards, setTokenCards] = useState<Card[]>([]);
  const [redActiveBattleground, setRedActiveBattleground] = useState<string | null>(null);
  const [blueActiveBattleground, setBlueActiveBattleground] = useState<string | null>(null);

  // Fetch board state
  const fetchBoardState = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/board-state`);
      if (!response.ok) {
        if (response.status === 404) {
          // Game doesn't exist, create it
          await fetch(`/api/games`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameId }),
          });
          // Fetch again after creation
          const retry = await fetch(`/api/games/${gameId}/board-state`);
          if (retry.ok) {
            const data = await retry.json();
            setRedBoardState(data.red);
            setBlueBoardState(data.blue);
            if (data.activeBattlegrounds) {
              setRedActiveBattleground(data.activeBattlegrounds.red);
              setBlueActiveBattleground(data.activeBattlegrounds.blue);
            }
            if (data.scores) {
              setRedScore(data.scores.red);
              setBlueScore(data.scores.blue);
            }
          }
        } else {
          throw new Error("Failed to fetch board state");
        }
      } else {
        const data = await response.json();
        setRedBoardState(data.red);
        setBlueBoardState(data.blue);
        if (data.activeBattlegrounds) {
          setRedActiveBattleground(data.activeBattlegrounds.red);
          setBlueActiveBattleground(data.activeBattlegrounds.blue);
        }
        if (data.scores) {
          setRedScore(data.scores.red);
          setBlueScore(data.scores.blue);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchBoardState();
  }, [fetchBoardState]);

  // Fetch token cards
  useEffect(() => {
    async function fetchTokens() {
      try {
        const response = await fetch("/api/cards?type=Token%20Unit");
        if (response.ok) {
          const data = await response.json();
          setTokenCards(data);
        }
      } catch (err) {
        console.error("Failed to fetch token cards:", err);
      }
    }
    fetchTokens();
  }, []);

  // Subscribe to real-time updates via Pusher
  useGameUpdates(gameId, {
    onUpdate: fetchBoardState,
    onPeek: (event) => {
      // Only show toast if opponent peeked
      if (event.playerSide !== currentPlayer) {
        const deckName = event.deckType === "rune_deck" ? "rune deck" : "deck";
        const playerName = event.playerSide === "red" ? "Red" : "Blue";
        toast(`${playerName} peeked at top ${event.count} card${event.count > 1 ? "s" : ""} of their ${deckName}`);
      }
    },
  });

  // Ready all exhausted cards for current player (runes, legend, base, battlefield)
  const handleReadyAll = useCallback(async () => {
    const boardState = currentPlayer === "red" ? redBoardState : blueBoardState;

    // Get all exhausted cards from relevant zones (only cards owned by current player)
    const exhaustedCards = [
      ...boardState.zones.runes.filter(c => c.isExhausted),
      ...boardState.zones.legend.filter(c => c.isExhausted),
      ...boardState.zones.champion.filter(c => c.isExhausted),
      ...boardState.zones.base.filter(c => c.isExhausted),
      ...boardState.zones.battlefield.filter(c => c.isExhausted && c.playerSide === currentPlayer),
    ];

    if (exhaustedCards.length === 0) return;

    // Unexhaust each card
    for (const card of exhaustedCards) {
      await fetch(`/api/games/${gameId}/exhaust-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardInstanceId: card.cardInstanceId }),
      });
    }

    toast.success(`Readied ${exhaustedCards.length} card${exhaustedCards.length > 1 ? "s" : ""}`);
    fetchBoardState();
  }, [gameId, currentPlayer, redBoardState, blueBoardState, fetchBoardState]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent spacebar from scrolling the page
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
      }
      // Prevent Alt from focusing browser chrome
      if (e.key === "Alt") {
        e.preventDefault();
      }
      // Ignore other shortcuts if a drawer/dialog is open
      if (document.querySelector('[data-vaul-drawer]') || document.querySelector('[role="dialog"]')) {
        return;
      }
      // Shift+R to ready all cards
      if (e.shiftKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        handleReadyAll();
      }
    };

    // Disable default right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [handleReadyAll]);

  const handleMoveCard = useCallback(
    async (
      cardInstanceId: string,
      fromZone: ZoneType,
      toZone: ZoneType,
      fromPlayer: PlayerSide,
      toPlayer: PlayerSide,
      battlefieldSide?: PlayerSide
    ) => {
      try {
        await fetch(`/api/games/${gameId}/move-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardInstanceId,
            fromZone,
            toZone,
            fromPlayer,
            toPlayer,
            battlefieldSide,
          }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to move card:", err);
      }
    },
    [gameId, fetchBoardState]
  );

  const handleFlipCard = useCallback(
    async (cardInstanceId: string, playerSide: PlayerSide) => {
      try {
        await fetch(`/api/games/${gameId}/flip-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardInstanceId }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to flip card:", err);
      }
    },
    [gameId, fetchBoardState]
  );

  const handleExhaustCard = useCallback(
    async (cardInstanceId: string, playerSide: PlayerSide) => {
      try {
        await fetch(`/api/games/${gameId}/exhaust-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardInstanceId }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to exhaust card:", err);
      }
    },
    [gameId, fetchBoardState]
  );

  const handleDraw = useCallback(
    async (playerSide: PlayerSide, deckType: "main_deck" | "rune_deck") => {
      try {
        await fetch(`/api/games/${gameId}/draw`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerSide, deckType }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to draw card:", err);
      }
    },
    [gameId, fetchBoardState]
  );

  const handleShuffle = useCallback(
    async (playerSide: PlayerSide, deckType: "main_deck" | "rune_deck") => {
      try {
        await fetch(`/api/games/${gameId}/shuffle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerSide, zone: deckType }),
        });
        const deckName = deckType === "rune_deck" ? "Rune deck" : "Deck";
        toast.success(`${deckName} shuffled`);
        fetchBoardState();
      } catch (err) {
        console.error("Failed to shuffle:", err);
        toast.error("Failed to shuffle deck");
      }
    },
    [gameId, fetchBoardState]
  );

  const handleReset = useCallback(async () => {
    try {
      await fetch(`/api/games/${gameId}/reset`, {
        method: "POST",
      });
      fetchBoardState();
    } catch (err) {
      console.error("Failed to reset game:", err);
    }
  }, [gameId, fetchBoardState]);

  const handleLockChampion = useCallback(
    async (playerSide: PlayerSide, championInstanceId: string, otherChampionIds: string[]) => {
      try {
        // Move other champions to main deck (randomly inserted)
        for (const cardId of otherChampionIds) {
          await fetch(`/api/games/${gameId}/move-card`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cardInstanceId: cardId,
              fromZone: "champion",
              toZone: "main_deck",
              fromPlayer: playerSide,
              toPlayer: playerSide,
            }),
          });
        }
        // Shuffle the main deck to randomize champion positions
        await fetch(`/api/games/${gameId}/shuffle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerSide, zone: "main_deck" }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to lock champion:", err);
      }
    },
    [gameId, fetchBoardState]
  );

  const handlePlayChampion = useCallback(
    async (playerSide: PlayerSide, championInstanceId: string) => {
      try {
        // Move champion to base
        await fetch(`/api/games/${gameId}/move-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardInstanceId: championInstanceId,
            fromZone: "champion",
            toZone: "base",
            fromPlayer: playerSide,
            toPlayer: playerSide,
          }),
        });
        // Exhaust the champion
        await fetch(`/api/games/${gameId}/exhaust-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardInstanceId: championInstanceId }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to play champion:", err);
      }
    },
    [gameId, fetchBoardState]
  );

  const handleRecycleRune = useCallback(
    async (playerSide: PlayerSide, cardInstanceId: string) => {
      try {
        await fetch(`/api/games/${gameId}/recycle-rune`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerSide, cardInstanceId }),
        });
        toast.success("Rune recycled");
        fetchBoardState();
      } catch (err) {
        console.error("Failed to recycle rune:", err);
        toast.error("Failed to recycle rune");
      }
    },
    [gameId, fetchBoardState]
  );

  // Hand card action handlers
  const handlePlayFromHand = useCallback(
    async (playerSide: PlayerSide, cardInstanceId: string) => {
      try {
        // Move card from hand to base, exhausted
        await fetch(`/api/games/${gameId}/move-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardInstanceId,
            fromZone: "hand",
            toZone: "base",
            fromPlayer: playerSide,
            toPlayer: playerSide,
          }),
        });
        // Exhaust the card
        await fetch(`/api/games/${gameId}/exhaust-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardInstanceId }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to play card:", err);
      }
    },
    [gameId, fetchBoardState]
  );

  const handlePlayHiddenFromHand = useCallback(
    async (playerSide: PlayerSide, cardInstanceId: string) => {
      try {
        // Flip the card face down first
        await fetch(`/api/games/${gameId}/flip-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardInstanceId }),
        });
        // Move card from hand to base
        await fetch(`/api/games/${gameId}/move-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardInstanceId,
            fromZone: "hand",
            toZone: "base",
            fromPlayer: playerSide,
            toPlayer: playerSide,
          }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to play hidden card:", err);
      }
    },
    [gameId, fetchBoardState]
  );

  const handleTrashFromHand = useCallback(
    async (playerSide: PlayerSide, cardInstanceId: string) => {
      try {
        // Move card from hand to trash, face up
        await fetch(`/api/games/${gameId}/move-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardInstanceId,
            fromZone: "hand",
            toZone: "trash",
            fromPlayer: playerSide,
            toPlayer: playerSide,
          }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to trash card:", err);
      }
    },
    [gameId, fetchBoardState]
  );

  const handleRecycleFromHand = useCallback(
    async (playerSide: PlayerSide, cardInstanceId: string) => {
      try {
        // Move card from hand to bottom of main_deck, face down
        await fetch(`/api/games/${gameId}/recycle-hand`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerSide, cardInstanceId }),
        });
        toast.success("Card recycled to deck");
        fetchBoardState();
      } catch (err) {
        console.error("Failed to recycle card:", err);
        toast.error("Failed to recycle card");
      }
    },
    [gameId, fetchBoardState]
  );

  // Base/battlefield card action handlers
  const handlePickup = useCallback(
    async (playerSide: PlayerSide, cardInstanceId: string) => {
      try {
        // Get the card's current zone from board state
        const boardState = playerSide === "red" ? redBoardState : blueBoardState;
        const zones = boardState.zones;

        // Find the card in base or battlefield
        let fromZone: ZoneType | null = null;
        if (zones.base.some(c => c.cardInstanceId === cardInstanceId)) {
          fromZone = "base";
        } else if (zones.battlefield.some(c => c.cardInstanceId === cardInstanceId)) {
          fromZone = "battlefield";
        }

        if (!fromZone) {
          console.error("Card not found in base or battlefield");
          return;
        }

        await fetch(`/api/games/${gameId}/move-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardInstanceId,
            fromZone,
            toZone: "hand",
            fromPlayer: playerSide,
            toPlayer: playerSide,
          }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to pickup card:", err);
      }
    },
    [gameId, fetchBoardState, redBoardState, blueBoardState]
  );

  const handleTrash = useCallback(
    async (playerSide: PlayerSide, cardInstanceId: string) => {
      try {
        // Get the card's current zone from board state
        const boardState = playerSide === "red" ? redBoardState : blueBoardState;
        const zones = boardState.zones;

        // Find the card in base or battlefield
        let fromZone: ZoneType | null = null;
        if (zones.base.some(c => c.cardInstanceId === cardInstanceId)) {
          fromZone = "base";
        } else if (zones.battlefield.some(c => c.cardInstanceId === cardInstanceId)) {
          fromZone = "battlefield";
        }

        if (!fromZone) {
          console.error("Card not found in base or battlefield");
          return;
        }

        await fetch(`/api/games/${gameId}/move-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardInstanceId,
            fromZone,
            toZone: "trash",
            fromPlayer: playerSide,
            toPlayer: playerSide,
          }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to trash card:", err);
      }
    },
    [gameId, fetchBoardState, redBoardState, blueBoardState]
  );

  // Trash zone handlers
  const handleRecycleTrash = useCallback(
    async (playerSide: PlayerSide) => {
      try {
        await fetch(`/api/games/${gameId}/recycle-trash`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerSide }),
        });
        toast.success("Trash recycled to deck");
        fetchBoardState();
      } catch (err) {
        console.error("Failed to recycle trash:", err);
        toast.error("Failed to recycle trash");
      }
    },
    [gameId, fetchBoardState]
  );

  const handlePickupFromTrash = useCallback(
    async (playerSide: PlayerSide, cardInstanceId: string) => {
      try {
        await fetch(`/api/games/${gameId}/move-card`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardInstanceId,
            fromZone: "trash",
            toZone: "hand",
            fromPlayer: playerSide,
            toPlayer: playerSide,
          }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to pickup card from trash:", err);
      }
    },
    [gameId, fetchBoardState]
  );

  const handleRecycleBattlegroundArea = useCallback(
    async (playerSide: PlayerSide, cardInstanceId: string) => {
      try {
        await fetch(`/api/games/${gameId}/recycle-battleground`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerSide, cardInstanceId }),
        });
        toast.success("Card recycled to deck");
        fetchBoardState();
      } catch (err) {
        console.error("Failed to recycle from battleground area:", err);
        toast.error("Failed to recycle card");
      }
    },
    [gameId, fetchBoardState]
  );

  const handleSpawnToken = useCallback(
    async (cardId: string) => {
      try {
        await fetch(`/api/games/${gameId}/spawn-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerSide: currentPlayer, cardId }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to spawn token:", err);
        toast.error("Failed to spawn token");
      }
    },
    [gameId, currentPlayer, fetchBoardState]
  );

  const handleUpdateTempMight = useCallback(
    async (cardInstanceId: string, tempMight: number | null) => {
      try {
        await fetch(`/api/games/${gameId}/update-temp-might`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardInstanceId, tempMight }),
        });
        fetchBoardState();
      } catch (err) {
        console.error("Failed to update temp might:", err);
      }
    },
    [gameId, fetchBoardState]
  );

  const handlePeek = useCallback(
    async (playerSide: PlayerSide, deckType: "main_deck" | "rune_deck", count: number) => {
      try {
        await fetch(`/api/games/${gameId}/notify-peek`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerSide, deckType, count }),
        });
      } catch (err) {
        console.error("Failed to notify peek:", err);
      }
    },
    [gameId]
  );

  const handleSetActiveBattleground = useCallback(
    async (playerSide: PlayerSide, cardInstanceId: string | null) => {
      try {
        await fetch(`/api/games/${gameId}/set-active-battleground`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerSide, cardInstanceId }),
        });
        // Update local state immediately
        if (playerSide === "red") {
          setRedActiveBattleground(cardInstanceId);
        } else {
          setBlueActiveBattleground(cardInstanceId);
        }
      } catch (err) {
        console.error("Failed to set active battleground:", err);
      }
    },
    [gameId]
  );

  const handleSetScore = useCallback(
    async (playerSide: PlayerSide, score: number) => {
      // Update local state immediately for responsiveness
      if (playerSide === "red") {
        setRedScore(score);
      } else {
        setBlueScore(score);
      }
      // Persist to server
      try {
        await fetch(`/api/games/${gameId}/set-score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerSide, score }),
        });
      } catch (err) {
        console.error("Failed to set score:", err);
      }
    },
    [gameId]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <Drawer direction="right">
    <div className="min-h-screen">
      {/* Controls Bar */}
      <div className="fixed top-0 left-0 right-0 bg-board-bg/90 backdrop-blur border-b border-board-border z-40 p-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left - Player indicator */}
          <div className="flex items-center gap-4 w-48">
            <span className={currentPlayer === "red" ? "text-red-400" : "text-blue-400"}>
              Playing as {currentPlayer === "red" ? "Red" : "Blue"}
            </span>
          </div>

          {/* Centre - Score */}
          <ScoreTracker
            redScore={redScore}
            blueScore={blueScore}
            onRedScoreChange={(score) => handleSetScore("red", score)}
            onBlueScoreChange={(score) => handleSetScore("blue", score)}
            currentPlayer={currentPlayer}
          />

          {/* Right - Menu button */}
          <div className="w-48 flex justify-end">
            <DrawerTrigger asChild>
              <button className="p-2 hover:bg-board-zone rounded transition-colors text-gold hover:text-gold-light" title="Menu">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            </DrawerTrigger>
          </div>
        </div>
      </div>

      {/* Side Drawer */}
      <DrawerContent className="bg-board-bg border-board-border">
        <DrawerHeader className="border-b border-board-border">
          <DrawerTitle className="text-gold">Game Menu</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 flex flex-col gap-2">
          {/* Deck Import */}
          <DrawerClose asChild>
            <button
              onClick={() => setShowDeckImporter(true)}
              className="w-full px-4 py-3 bg-board-zone hover:bg-board-hover rounded text-left text-gray-200 transition-colors"
            >
              Import Deck
            </button>
          </DrawerClose>

          {/* Spawn Token */}
          <DrawerClose asChild>
            <button
              onClick={() => setShowTokenDrawer(true)}
              className="w-full px-4 py-3 bg-board-zone hover:bg-board-hover rounded text-left text-gray-200 transition-colors"
            >
              Spawn Token
            </button>
          </DrawerClose>

          {/* Flip Opponent Toggle */}
          <label className="flex items-center gap-3 px-4 py-3 bg-board-zone hover:bg-board-hover rounded cursor-pointer text-gray-200 transition-colors">
            <input
              type="checkbox"
              checked={invertOpponent}
              onChange={(e) => setInvertOpponent(e.target.checked)}
              className="rounded w-4 h-4 accent-gold"
            />
            Flip opponent&apos;s board
          </label>

          {/* Reset Game */}
          <DrawerClose asChild>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full px-4 py-3 bg-board-zone hover:bg-board-hover rounded text-left text-gray-200 transition-colors"
            >
              Reset Game
            </button>
          </DrawerClose>

          {/* Divider */}
          <div className="border-t border-board-border my-2" />

          {/* Leave Game */}
          <a
            href="/"
            className="w-full px-4 py-3 bg-board-zone hover:bg-board-hover rounded text-left text-gray-200 block transition-colors"
          >
            Leave Game
          </a>
        </div>
      </DrawerContent>

      {/* Game Board */}
      <div className="pt-14">
        <GameBoard
          redBoardState={redBoardState}
          blueBoardState={blueBoardState}
          currentPlayer={currentPlayer}
          invertOpponent={invertOpponent}
          onMoveCard={handleMoveCard}
          onFlipCard={handleFlipCard}
          onExhaustCard={handleExhaustCard}
          onDraw={handleDraw}
          onShuffle={handleShuffle}
          onPeek={handlePeek}
          onRecycleRune={handleRecycleRune}
          onPlayFromHand={handlePlayFromHand}
          onPlayHiddenFromHand={handlePlayHiddenFromHand}
          onTrashFromHand={handleTrashFromHand}
          onRecycleFromHand={handleRecycleFromHand}
          onLockChampion={handleLockChampion}
          onPlayChampion={handlePlayChampion}
          onPickup={handlePickup}
          onTrash={handleTrash}
          onRecycleTrash={handleRecycleTrash}
          onPickupFromTrash={handlePickupFromTrash}
          onRecycleBattlegroundArea={handleRecycleBattlegroundArea}
          onSetActiveBattleground={handleSetActiveBattleground}
          redActiveBattleground={redActiveBattleground}
          blueActiveBattleground={blueActiveBattleground}
          onUpdateTempMight={handleUpdateTempMight}
        />
      </div>

      {/* Deck Importer Modal */}
      {showDeckImporter && (
        <DeckImporter
          gameId={gameId}
          playerSide={currentPlayer}
          onImportComplete={fetchBoardState}
          onClose={() => setShowDeckImporter(false)}
        />
      )}

      {/* Reset Game Confirm Dialog */}
      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset Game"
        description="Are you sure you want to reset the game? All cards will be returned to their starting positions."
        confirmLabel="Reset"
        variant="destructive"
        onConfirm={handleReset}
      />

      {/* Token Drawer */}
      <Drawer open={showTokenDrawer} onOpenChange={setShowTokenDrawer}>
        <DrawerContent className="bg-board-bg border-board-border max-h-[50vh]">
          <CardZoomProvider>
            <div className="mx-auto w-full max-w-4xl">
              <DrawerHeader className="border-b border-board-border">
                <DrawerTitle className="text-gold">Spawn Token</DrawerTitle>
              </DrawerHeader>
              <div className="p-6">
                <p className="text-gray-400 text-sm mb-4">Click a token to spawn it in your base. Click multiple times to spawn more.</p>
                <div className="flex justify-center gap-6 flex-wrap">
                  {tokenCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handleSpawnToken(card.id)}
                      className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-board-hover transition-colors"
                    >
                      <CardWithZoom card={card} isFaceUp={true}>
                        <div className="w-[120px] rounded-lg overflow-hidden border-2 border-board-border hover:border-gold transition-colors" style={{ aspectRatio: "5/7" }}>
                          {card.imageUrl ? (
                            <img
                              src={card.imageUrl}
                              alt={card.cardName}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full bg-board-zone flex items-center justify-center">
                              <span className="text-xs text-gold/30">{card.cardName}</span>
                            </div>
                          )}
                        </div>
                      </CardWithZoom>
                      <span className="text-sm text-gray-300">{card.cardName}</span>
                      <span className="text-xs text-gray-500">{card.might} Might</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardZoomProvider>
        </DrawerContent>
      </Drawer>
    </div>
    </Drawer>
  );
}
