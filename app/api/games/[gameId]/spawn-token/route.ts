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

    const { playerSide, cardId } = body as {
      playerSide: PlayerSide;
      cardId: string;
    };

    const repo = getGameRepository();

    // Add token to base, face up, ready to use
    const cardInstance = await repo.addCardToZone(gameId, playerSide, "base", cardId, {
      isFaceUp: true,
      isExhausted: false,
    });

    await broadcastGameUpdate(gameId);
    return NextResponse.json({ success: true, cardInstance });
  } catch (error) {
    console.error("Error spawning token:", error);
    return NextResponse.json({ error: "Failed to spawn token" }, { status: 500 });
  }
}
