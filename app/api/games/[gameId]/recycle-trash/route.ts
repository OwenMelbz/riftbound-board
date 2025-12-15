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
    const { playerSide } = body as {
      playerSide: PlayerSide;
    };

    const repo = getGameRepository();
    await repo.recycleTrash(gameId, playerSide);

    await broadcastGameUpdate(gameId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recycling trash:", error);
    return NextResponse.json({ error: "Failed to recycle trash" }, { status: 500 });
  }
}
