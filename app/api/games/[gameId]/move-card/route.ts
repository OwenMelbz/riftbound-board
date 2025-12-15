import { NextRequest, NextResponse } from "next/server";
import { getGameRepository, getCardRepository } from "@/lib/repositories";
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

    const { cardInstanceId, fromZone, toZone, fromPlayer, toPlayer, battlefieldSide } = body;

    const gameRepo = getGameRepository();

    // If moving to trash, check if it's a token - tokens get removed entirely
    if (toZone === "trash") {
      const cardRepo = getCardRepository();
      const zone = await gameRepo.getZone(gameId, fromPlayer, fromZone);
      const cardInstance = zone.find(c => c.cardInstanceId === cardInstanceId);

      if (cardInstance) {
        const card = await cardRepo.findById(cardInstance.cardId);
        if (card?.cardType === "Token Unit") {
          // Remove token from game entirely
          await gameRepo.removeCard(gameId, cardInstanceId);
          await broadcastGameUpdate(gameId);
          return NextResponse.json({ success: true, removed: true });
        }
      }
    }

    await gameRepo.moveCard(gameId, fromPlayer, {
      cardInstanceId,
      fromZone,
      toZone,
      toPlayerSide: toPlayer,
      battlefieldSide,
    });

    await broadcastGameUpdate(gameId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error moving card:", error);
    return NextResponse.json({ error: "Failed to move card" }, { status: 500 });
  }
}
