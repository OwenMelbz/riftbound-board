import { NextRequest, NextResponse } from "next/server";
import { getGameRepository, getCardRepository } from "@/lib/repositories";
import { broadcastGameUpdate } from "@/lib/pusher/server";
import { parseTTSDeckList } from "@/lib/utils/deckParser";
import type { PlayerSide } from "@/lib/types/deck";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await request.json();
    const { playerSide, deckList } = body as {
      playerSide: PlayerSide;
      deckList: string;
    };

    if (!playerSide || !deckList) {
      return NextResponse.json(
        { error: "Missing playerSide or deckList" },
        { status: 400 }
      );
    }

    const gameRepo = getGameRepository();
    const cardRepo = getCardRepository();

    // Parse the TTS deck list
    const parsed = parseTTSDeckList(deckList);

    if (parsed.errors.length > 0) {
      console.warn("Deck parsing warnings:", parsed.errors);
    }

    // Get all cards to match prefixes
    const allCards = await cardRepo.findAll();

    // Build a map of card prefix to card ID
    // e.g., "OGN-007" -> "OGN-007/298"
    const cardPrefixMap = new Map<string, typeof allCards[0]>();
    for (const card of allCards) {
      // Extract prefix (e.g., "OGN-007/298" -> "OGN-007")
      const prefix = card.id.split("/")[0];
      // Only add if not already present (prefer non-showcase versions)
      if (!cardPrefixMap.has(prefix)) {
        cardPrefixMap.set(prefix, card);
      }
    }

    // Clear existing cards for this player
    const existingState = await gameRepo.getBoardState(gameId, playerSide);
    for (const zone of Object.values(existingState.zones)) {
      for (const card of zone) {
        await gameRepo.removeCard(gameId, card.cardInstanceId);
      }
    }

    // Track results
    const imported: { cardName: string; quantity: number; zone: string }[] = [];
    const notFound: string[] = [];

    // Add cards to appropriate zones based on card type
    for (const { cardPrefix, quantity } of parsed.cards) {
      const card = cardPrefixMap.get(cardPrefix);

      if (!card) {
        notFound.push(cardPrefix);
        continue;
      }

      // Determine which zone based on card type
      let zone: string;
      let isFaceUp = false;

      switch (card.cardType) {
        case "Legend":
        case "Champion Legend":
          zone = "legend";
          isFaceUp = true;
          break;
        case "Champion Unit":
          // First champion goes to champion zone, rest to main deck
          const existingChampion = imported.find(i => i.zone === "champion");
          if (!existingChampion) {
            zone = "champion";
            isFaceUp = true;
          } else {
            zone = "main_deck";
            isFaceUp = false;
          }
          break;
        case "Basic Rune":
          zone = "rune_deck";
          isFaceUp = false;
          break;
        case "Battlefield":
          zone = "battlefield";
          isFaceUp = true;
          break;
        default:
          // Units, Spells, Gear, Signature cards go to main deck
          zone = "main_deck";
          isFaceUp = false;
          break;
      }

      // Add the card(s) to the zone
      for (let i = 0; i < quantity; i++) {
        await gameRepo.addCardToZone(
          gameId,
          playerSide,
          zone as any,
          card.id,
          { isFaceUp }
        );
      }

      imported.push({
        cardName: card.cardName,
        quantity,
        zone,
      });
    }

    // Shuffle the decks
    await gameRepo.shuffleZone(gameId, playerSide, "main_deck");
    await gameRepo.shuffleZone(gameId, playerSide, "rune_deck");

    await broadcastGameUpdate(gameId);
    return NextResponse.json({
      success: true,
      imported,
      notFound,
      warnings: parsed.errors,
      summary: {
        totalCards: imported.reduce((sum, i) => sum + i.quantity, 0),
        mainDeck: imported.filter(i => i.zone === "main_deck").reduce((sum, i) => sum + i.quantity, 0),
        runeDeck: imported.filter(i => i.zone === "rune_deck").reduce((sum, i) => sum + i.quantity, 0),
        legend: imported.filter(i => i.zone === "legend").length,
        champion: imported.filter(i => i.zone === "champion").length,
        battlefield: imported.filter(i => i.zone === "battlefield").length,
      },
    });
  } catch (error) {
    console.error("Error importing deck:", error);
    return NextResponse.json(
      { error: "Failed to import deck" },
      { status: 500 }
    );
  }
}
