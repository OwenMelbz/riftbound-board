import { NextRequest, NextResponse } from "next/server";
import { getGameRepository } from "@/lib/repositories";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const repo = getGameRepository();

    const game = await repo.findById(gameId);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const boardState = await repo.getFullBoardState(gameId);
    const activeBattlegrounds = await repo.getActiveBattlegrounds(gameId);
    const scores = await repo.getScores(gameId);

    return NextResponse.json({
      ...boardState,
      activeBattlegrounds,
      scores,
    });
  } catch (error) {
    console.error("Error fetching board state:", error);
    return NextResponse.json(
      { error: "Failed to fetch board state" },
      { status: 500 }
    );
  }
}
