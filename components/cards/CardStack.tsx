"use client";

interface CardStackProps {
  count: number;
  label?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "rune";
}

const sizeClasses = {
  sm: "w-[80px] h-[112px]",
  md: "w-[120px] h-[168px]",
  lg: "w-[160px] h-[224px]",
};

export function CardStack({
  count,
  label,
  onClick,
  size = "md",
  variant = "default",
}: CardStackProps) {
  const backImage = variant === "rune" ? "/rune-back.png" : "/card-back.png";

  return (
    <div className="relative">
      {/* Stack effect - show multiple card backs offset */}
      {count > 2 && (
        <div
          className={`absolute ${sizeClasses[size]} rounded-lg overflow-hidden transform translate-x-1 translate-y-1`}
        >
          <img
            src={backImage}
            alt="Card back"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}
      {count > 1 && (
        <div
          className={`absolute ${sizeClasses[size]} rounded-lg overflow-hidden transform translate-x-0.5 translate-y-0.5`}
        >
          <img
            src={backImage}
            alt="Card back"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* Top card or empty slot */}
      <div
        className={`
          relative ${sizeClasses[size]} rounded-lg cursor-pointer overflow-hidden
          transition-all duration-200
          ${count > 0 ? "hover:scale-105" : "bg-board-zone border-2 border-dashed border-board-border"}
          flex items-center justify-center
        `}
        onClick={onClick}
      >
        {count > 0 ? (
          <img
            src={backImage}
            alt="Card back"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <span className="text-gold/30 text-xs">{label || "Empty"}</span>
        )}
      </div>

      {/* Card count badge - outside overflow-hidden container */}
      {count > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-xs font-bold z-10">
          {count}
        </div>
      )}
    </div>
  );
}
