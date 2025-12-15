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
    const { cardInstanceId } = body as { cardInstanceId: string };

    const repo = getGameRepository();
    await repo.flipCard(gameId, cardInstanceId);

    await broadcastGameUpdate(gameId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error flipping card:", error);
    return NextResponse.json({ error: "Failed to flip card" }, { status: 500 });
  }
}
