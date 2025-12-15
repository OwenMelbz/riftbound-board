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

    const { playerSide, score } = body as {
      playerSide: PlayerSide;
      score: number;
    };

    // Validate score is between 0 and 9
    if (score < 0 || score > 9) {
      return NextResponse.json(
        { error: "Score must be between 0 and 9" },
        { status: 400 }
      );
    }

    const gameRepo = getGameRepository();
    await gameRepo.setScore(gameId, playerSide, score);

    // Broadcast the update so both players see it
    await broadcastGameUpdate(gameId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting score:", error);
    return NextResponse.json(
      { error: "Failed to set score" },
      { status: 500 }
    );
  }
}
