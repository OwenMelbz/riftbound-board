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
    const { playerSide, cardInstanceId } = await request.json() as {
      playerSide: PlayerSide;
      cardInstanceId: string;
    };

    if (!playerSide || !cardInstanceId) {
      return NextResponse.json(
        { error: "Missing required fields: playerSide, cardInstanceId" },
        { status: 400 }
      );
    }

    const repo = getGameRepository();
    await repo.recycleBattlefield(gameId, playerSide, cardInstanceId);

    await broadcastGameUpdate(gameId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recycling from battleground area:", error);
    return NextResponse.json(
      { error: "Failed to recycle from battleground area" },
      { status: 500 }
    );
  }
}
