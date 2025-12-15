"use client";

import { useEffect } from "react";
import { getPusherClient } from "@/lib/pusher/client";
import type { PlayerSide } from "@/lib/types/deck";

interface PeekEvent {
  playerSide: PlayerSide;
  deckType: "main_deck" | "rune_deck";
  count: number;
  timestamp: number;
}

interface UseGameUpdatesOptions {
  onUpdate: () => void;
  onPeek?: (event: PeekEvent) => void;
}

export function useGameUpdates(gameId: string, options: UseGameUpdatesOptions | (() => void)) {
  // Support both old signature (just a callback) and new signature (options object)
  const { onUpdate, onPeek } = typeof options === "function"
    ? { onUpdate: options, onPeek: undefined }
    : options;

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`game-${gameId}`);

    channel.bind("game_state_updated", () => {
      onUpdate();
    });

    if (onPeek) {
      channel.bind("player_peeked", (data: PeekEvent) => {
        onPeek(data);
      });
    }

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`game-${gameId}`);
    };
  }, [gameId, onUpdate, onPeek]);
}
