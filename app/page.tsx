"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PlayerSide = "red" | "blue";

export default function HomePage() {
  const router = useRouter();
  const [selectedSide, setSelectedSide] = useState<PlayerSide | null>(null);

  const handleJoinGame = () => {
    if (selectedSide) {
      // For now, use a fixed game ID. Later this can be dynamic.
      router.push(`/board/game-1?player=${selectedSide}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-2">Riftbound TCG</h1>
      <p className="text-gray-400 mb-12">Digital Playing Board</p>

      <div className="mb-8">
        <h2 className="text-xl mb-4 text-center">Choose Your Side</h2>
        <div className="flex gap-6">
          <button
            onClick={() => setSelectedSide("red")}
            className={`
              w-40 h-48 rounded-lg border-4 transition-all
              flex flex-col items-center justify-center gap-2
              ${
                selectedSide === "red"
                  ? "border-red-500 bg-red-500/20 scale-105"
                  : "border-gray-600 bg-gray-800 hover:border-red-400"
              }
            `}
          >
            <div className="w-16 h-16 rounded-full bg-red-600" />
            <span className="text-lg font-semibold">Red Side</span>
          </button>

          <button
            onClick={() => setSelectedSide("blue")}
            className={`
              w-40 h-48 rounded-lg border-4 transition-all
              flex flex-col items-center justify-center gap-2
              ${
                selectedSide === "blue"
                  ? "border-blue-500 bg-blue-500/20 scale-105"
                  : "border-gray-600 bg-gray-800 hover:border-blue-400"
              }
            `}
          >
            <div className="w-16 h-16 rounded-full bg-blue-600" />
            <span className="text-lg font-semibold">Blue Side</span>
          </button>
        </div>
      </div>

      <button
        onClick={handleJoinGame}
        disabled={!selectedSide}
        className={`
          px-8 py-3 rounded-lg font-semibold text-lg transition-all
          ${
            selectedSide
              ? "bg-green-600 hover:bg-green-500 cursor-pointer"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }
        `}
      >
        Join Game
      </button>
    </main>
  );
}
