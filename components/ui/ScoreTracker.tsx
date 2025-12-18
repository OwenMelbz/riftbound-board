"use client";

interface ScoreTrackerProps {
  redScore: number;
  blueScore: number;
  onRedScoreChange: (score: number) => void;
  onBlueScoreChange: (score: number) => void;
  currentPlayer: "red" | "blue";
}

export function ScoreTracker({
  redScore,
  blueScore,
  onRedScoreChange,
  onBlueScoreChange,
  currentPlayer,
}: ScoreTrackerProps) {
  const handleClick = (side: "red" | "blue") => {
    if (side === "red") {
      onRedScoreChange(Math.min(8, redScore + 1));
    } else {
      onBlueScoreChange(Math.min(8, blueScore + 1));
    }
  };

  const handleRightClick = (e: React.MouseEvent, side: "red" | "blue") => {
    e.preventDefault();
    if (side === "red") {
      onRedScoreChange(Math.max(0, redScore - 1));
    } else {
      onBlueScoreChange(Math.max(0, blueScore - 1));
    }
  };

  return (
    <div className="flex items-center gap-1 select-none">
      <button
        onClick={() => handleClick("red")}
        onContextMenu={(e) => handleRightClick(e, "red")}
        className={`
          w-8 h-8 rounded flex items-center justify-center font-bold text-lg
          ${currentPlayer === "red" ? "bg-red-600" : "bg-red-600/50"}
          hover:bg-red-500 transition-colors cursor-pointer
          ${redScore >= 8 ? "ring-2 ring-yellow-400" : ""}
        `}
        title="Left-click: +1, Right-click: -1"
      >
        {redScore}
      </button>
      <span className="text-gray-500 font-bold">:</span>
      <button
        onClick={() => handleClick("blue")}
        onContextMenu={(e) => handleRightClick(e, "blue")}
        className={`
          w-8 h-8 rounded flex items-center justify-center font-bold text-lg
          ${currentPlayer === "blue" ? "bg-blue-600" : "bg-blue-600/50"}
          hover:bg-blue-500 transition-colors cursor-pointer
          ${blueScore >= 8 ? "ring-2 ring-yellow-400" : ""}
        `}
        title="Left-click: +1, Right-click: -1"
      >
        {blueScore}
      </button>
    </div>
  );
}
