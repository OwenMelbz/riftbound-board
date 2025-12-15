import { NextRequest, NextResponse } from "next/server";
import { broadcastPeek } from "@/lib/pusher/server";
import type { PlayerSide } from "@/lib/types/deck";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await request.json();

    const { playerSide, deckType, count } = body as {
      playerSide: PlayerSide;
      deckType: "main_deck" | "rune_deck";
      count: number;
    };

    await broadcastPeek(gameId, playerSide, deckType, count);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error notifying peek:", error);
    return NextResponse.json({ error: "Failed to notify peek" }, { status: 500 });
  }
}
