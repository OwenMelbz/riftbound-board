import { NextRequest, NextResponse } from "next/server";
import { getGameRepository, getCardRepository } from "@/lib/repositories";
import { broadcastGameUpdate } from "@/lib/pusher/server";
import { getStarterDeck, starterDecks } from "@/lib/data/starterDecks";
import type { PlayerSide } from "@/lib/types/deck";
import type { ZoneType } from "@/lib/types/game";

export async function GET() {
  // Return list of available starter decks
  return NextResponse.json(
    starterDecks.map(d => ({
      id: d.id,
      name: d.name,
      champion: d.champion,
      description: d.description,
    }))
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await request.json();
    const { playerSide, deckId } = body as {
      playerSide: PlayerSide;
      deckId: string;
    };

    if (!playerSide || !deckId) {
      return NextResponse.json(
        { error: "Missing playerSide or deckId" },
        { status: 400 }
      );
    }

    const starterDeck = getStarterDeck(deckId);
    if (!starterDeck) {
      return NextResponse.json(
        { error: `Unknown starter deck: ${deckId}` },
        { status: 404 }
      );
    }

    const gameRepo = getGameRepository();
    const cardRepo = getCardRepository();

    // Get all cards to match prefixes
    const allCards = await cardRepo.findAll();

    // Build a map of card prefix to card
    const cardPrefixMap = new Map<string, typeof allCards[0]>();
    for (const card of allCards) {
      const prefix = card.id.split("/")[0];
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
    let legendAdded = false;
    let championAdded = false;

    // Add cards to appropriate zones
    for (const [cardPrefix, quantity] of starterDeck.cards) {
      const card = cardPrefixMap.get(cardPrefix);

      if (!card) {
        notFound.push(cardPrefix);
        continue;
      }

      // Determine zone based on card type
      let zone: ZoneType;
      let isFaceUp = false;

      switch (card.cardType) {
        case "Legend":
        case "Champion Legend":
          if (!legendAdded) {
            zone = "legend";
            isFaceUp = true;
            legendAdded = true;
          } else {
            continue; // Skip extra legends
          }
          break;
        case "Champion Unit":
          if (!championAdded) {
            zone = "champion";
            isFaceUp = true;
            championAdded = true;
            // Add remaining copies to main deck
            if (quantity > 1) {
              for (let i = 1; i < quantity; i++) {
                await gameRepo.addCardToZone(gameId, playerSide, "main_deck", card.id, { isFaceUp: false });
              }
              imported.push({ cardName: card.cardName, quantity: quantity - 1, zone: "main_deck" });
            }
            // Add one to champion zone
            await gameRepo.addCardToZone(gameId, playerSide, zone, card.id, { isFaceUp });
            imported.push({ cardName: card.cardName, quantity: 1, zone });
            continue;
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
          zone = "main_deck";
          isFaceUp = false;
          break;
      }

      // Add cards to zone
      for (let i = 0; i < quantity; i++) {
        await gameRepo.addCardToZone(gameId, playerSide, zone, card.id, { isFaceUp });
      }

      imported.push({ cardName: card.cardName, quantity, zone });
    }

    // Shuffle decks
    await gameRepo.shuffleZone(gameId, playerSide, "main_deck");
    await gameRepo.shuffleZone(gameId, playerSide, "rune_deck");

    await broadcastGameUpdate(gameId);
    return NextResponse.json({
      success: true,
      deckName: starterDeck.name,
      imported,
      notFound,
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
    console.error("Error loading starter deck:", error);
    return NextResponse.json(
      { error: "Failed to load starter deck" },
      { status: 500 }
    );
  }
}
