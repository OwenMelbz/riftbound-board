import { NextRequest, NextResponse } from "next/server";
import { getGameRepository } from "@/lib/repositories";
import { broadcastGameUpdate } from "@/lib/pusher/server";
import type { PlayerSide } from "@/lib/types/deck";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await request.json();
    const { playerSide, deckType } = body as {
      playerSide: PlayerSide;
      deckType: "main_deck" | "rune_deck";
    };

    const repo = getGameRepository();
    const card = await repo.drawCard(gameId, playerSide, deckType);

    if (!card) {
      return NextResponse.json({ error: "No cards to draw" }, { status: 400 });
    }

    await broadcastGameUpdate(gameId);
    return NextResponse.json({ success: true, card });
  } catch (error) {
    console.error("Error drawing card:", error);
    return NextResponse.json({ error: "Failed to draw card" }, { status: 500 });
  }
}
