import { NextRequest, NextResponse } from "next/server";
import { getGameRepository } from "@/lib/repositories";
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
    const card = await repo.peekCard(gameId, playerSide, deckType);

    if (!card) {
      return NextResponse.json({ error: "No cards in deck" }, { status: 400 });
    }

    // Return the card data for display in the drawer
    return NextResponse.json({ success: true, card });
  } catch (error) {
    console.error("Error peeking card:", error);
    return NextResponse.json({ error: "Failed to peek card" }, { status: 500 });
  }
}
