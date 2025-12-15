import { NextRequest, NextResponse } from "next/server";
import { getGameRepository } from "@/lib/repositories";
import { broadcastGameUpdate } from "@/lib/pusher/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await request.json();

    const { cardInstanceId, tempMight } = body as {
      cardInstanceId: string;
      tempMight: number | null;
    };

    const repo = getGameRepository();

    await repo.updateTempMight(gameId, cardInstanceId, tempMight);

    await broadcastGameUpdate(gameId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating temp might:", error);
    return NextResponse.json({ error: "Failed to update temp might" }, { status: 500 });
  }
}
