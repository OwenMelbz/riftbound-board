import Pusher from "pusher";
import type { PlayerSide } from "@/lib/types/deck";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function broadcastGameUpdate(gameId: string) {
  await pusher.trigger(`game-${gameId}`, "game_state_updated", {
    timestamp: Date.now(),
  });
}

export async function broadcastPeek(
  gameId: string,
  playerSide: PlayerSide,
  deckType: "main_deck" | "rune_deck",
  count: number
) {
  await pusher.trigger(`game-${gameId}`, "player_peeked", {
    playerSide,
    deckType,
    count,
    timestamp: Date.now(),
  });
}

export { pusher };
