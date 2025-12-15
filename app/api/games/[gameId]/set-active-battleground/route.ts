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

    const { playerSide, cardInstanceId } = body as {
      playerSide: PlayerSide;
      cardInstanceId: string | null;
    };

    const gameRepo = getGameRepository();
    await gameRepo.setActiveBattleground(gameId, playerSide, cardInstanceId);

    // Broadcast the update so both players see it
    await broadcastGameUpdate(gameId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting active battleground:", error);
    return NextResponse.json(
      { error: "Failed to set active battleground" },
      { status: 500 }
    );
  }
}
