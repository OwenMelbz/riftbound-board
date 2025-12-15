import { NextRequest, NextResponse } from "next/server";
import { getGameRepository } from "@/lib/repositories";
import { broadcastGameUpdate } from "@/lib/pusher/server";
import type { ZoneType } from "@/lib/types";
import type { PlayerSide } from "@/lib/types/deck";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await request.json();

    const { playerSide, zone, cardId, isFaceUp } = body as {
      playerSide: PlayerSide;
      zone: ZoneType;
      cardId: string;
      isFaceUp?: boolean;
    };

    const repo = getGameRepository();
    const cardInstance = await repo.addCardToZone(gameId, playerSide, zone, cardId, {
      isFaceUp: isFaceUp ?? true,
    });

    await broadcastGameUpdate(gameId);
    return NextResponse.json({ success: true, cardInstance });
  } catch (error) {
    console.error("Error adding card:", error);
    return NextResponse.json({ error: "Failed to add card" }, { status: 500 });
  }
}
