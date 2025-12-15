import { NextRequest, NextResponse } from "next/server";
import { getCardRepository } from "@/lib/repositories";
import type { CardType, Domain, Rarity } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") as CardType | null;
    const domain = searchParams.get("domain") as Domain | null;
    const rarity = searchParams.get("rarity") as Rarity | null;
    const search = searchParams.get("search");

    const repo = getCardRepository();
    const cards = await repo.findAll({
      type: type || undefined,
      domain: domain || undefined,
      rarity: rarity || undefined,
      search: search || undefined,
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}
