"use client";

import { useState } from "react";
import type { PlayerSide } from "@/lib/types/deck";

interface DeckImporterProps {
  gameId: string;
  playerSide: PlayerSide;
  onImportComplete?: () => void;
  onClose: () => void;
}

interface ImportResult {
  success: boolean;
  deckName?: string;
  imported: { cardName: string; quantity: number; zone: string }[];
  notFound: string[];
  warnings?: string[];
  summary: {
    totalCards: number;
    mainDeck: number;
    runeDeck: number;
    legend: number;
    champion: number;
    battlefield: number;
  };
}

const STARTER_DECKS = [
  { id: "annie", name: "Annie", color: "bg-orange-600 hover:bg-orange-500" },
  { id: "lux", name: "Lux", color: "bg-yellow-600 hover:bg-yellow-500" },
  { id: "garen", name: "Garen", color: "bg-blue-600 hover:bg-blue-500" },
  { id: "yi", name: "Master Yi", color: "bg-purple-600 hover:bg-purple-500" },
];

export function DeckImporter({
  gameId,
  playerSide,
  onImportComplete,
  onClose,
}: DeckImporterProps) {
  const [deckList, setDeckList] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDeckId, setLoadingDeckId] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!deckList.trim()) {
      setError("Please paste a deck list");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/games/${gameId}/import-deck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerSide, deckList }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import deck");
      }

      setResult(data);
      onImportComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadStarterDeck = async (deckId: string) => {
    setLoadingDeckId(deckId);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/games/${gameId}/load-starter-deck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerSide, deckId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load starter deck");
      }

      setResult(data);
      onImportComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingDeckId(null);
    }
  };

  const isLoading = loading || loadingDeckId !== null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#252b3d] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Import Deck ({playerSide === "red" ? "Red" : "Blue"} Player)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {!result ? (
          <>
            {/* Starter Decks Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Load - Starter Decks</h3>
              <div className="grid grid-cols-2 gap-2">
                {STARTER_DECKS.map((deck) => (
                  <button
                    key={deck.id}
                    onClick={() => handleLoadStarterDeck(deck.id)}
                    disabled={isLoading}
                    className={`
                      px-4 py-3 rounded-lg font-semibold transition-all
                      ${deck.color}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {loadingDeckId === deck.id ? "Loading..." : `${deck.name} Starter`}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#3d4559]"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#252b3d] px-3 text-sm text-gray-500">or paste custom deck</span>
              </div>
            </div>

            {/* Custom Deck Import */}
            <p className="text-gray-400 text-sm mb-4">
              Paste your TTS (Tabletop Simulator) deck list below. Format: space-separated
              card codes like <code className="bg-black/30 px-1 rounded">OGN-007-1</code> where
              the last number is quantity.
            </p>

            <textarea
              value={deckList}
              onChange={(e) => setDeckList(e.target.value)}
              placeholder="OGN-007-1 OGN-039-2 OGN-027-1 ..."
              className="w-full h-32 bg-[#1a1f2e] border border-[#3d4559] rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />

            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
              >
                {loading ? "Importing..." : "Import Custom Deck"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-400 mb-2">
                {result.deckName ? `${result.deckName} Loaded!` : "Import Successful!"}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total Cards: {result.summary.totalCards}</div>
                <div>Main Deck: {result.summary.mainDeck}</div>
                <div>Rune Deck: {result.summary.runeDeck}</div>
                <div>Legend: {result.summary.legend}</div>
                <div>Champion: {result.summary.champion}</div>
                <div>Battlefield: {result.summary.battlefield}</div>
              </div>
            </div>

            {result.notFound.length > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-yellow-400 mb-2">
                  Cards Not Found ({result.notFound.length})
                </h3>
                <p className="text-sm text-yellow-200">
                  {result.notFound.join(", ")}
                </p>
              </div>
            )}

            {result.warnings && result.warnings.length > 0 && (
              <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-orange-400 mb-2">Warnings</h3>
                <ul className="text-sm text-orange-200 list-disc list-inside">
                  {result.warnings.slice(0, 10).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                  {result.warnings.length > 10 && (
                    <li>...and {result.warnings.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            <details className="mb-4">
              <summary className="cursor-pointer text-gray-400 hover:text-white">
                View imported cards ({result.imported.length} unique)
              </summary>
              <div className="mt-2 max-h-60 overflow-y-auto bg-[#1a1f2e] rounded-lg p-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="pb-2">Card</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Zone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.imported.map((card, i) => (
                      <tr key={i} className="border-t border-[#3d4559]">
                        <td className="py-1">{card.cardName}</td>
                        <td className="py-1">{card.quantity}</td>
                        <td className="py-1 text-gray-400">{card.zone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
