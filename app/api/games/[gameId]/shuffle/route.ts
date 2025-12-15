import { NextRequest, NextResponse } from "next/server";
import { getGameRepository } from "@/lib/repositories";
import { broadcastGameUpdate } from "@/lib/pusher/server";
import type { PlayerSide } from "@/lib/types/deck";
import type { ZoneType } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await request.json();
    const { playerSide, zone } = body as {
      playerSide: PlayerSide;
      zone: ZoneType;
    };

    const repo = getGameRepository();
    await repo.shuffleZone(gameId, playerSide, zone);

    await broadcastGameUpdate(gameId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error shuffling:", error);
    return NextResponse.json({ error: "Failed to shuffle" }, { status: 500 });
  }
}
