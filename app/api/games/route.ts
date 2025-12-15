import { NextRequest, NextResponse } from "next/server";
import { getGameRepository } from "@/lib/repositories";

export async function GET() {
  try {
    const repo = getGameRepository();
    const games = await repo.findActive();
    return NextResponse.json(games);
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repo = getGameRepository();

    // Check if we're creating with a specific ID (for joining existing game)
    if (body.gameId) {
      const existing = await repo.findById(body.gameId);
      if (existing) {
        return NextResponse.json(existing);
      }
      // Create game with the specified ID
      const game = await repo.create({
        id: body.gameId,
        redDeckId: body.redDeckId,
        blueDeckId: body.blueDeckId,
      });
      return NextResponse.json(game);
    }

    const game = await repo.create({
      redDeckId: body.redDeckId,
      blueDeckId: body.blueDeckId,
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
  }
}
