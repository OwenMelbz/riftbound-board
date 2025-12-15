"use client";

import { useState, useEffect } from "react";
import type { Card as CardType } from "@/lib/types";

interface CardProps {
  card: CardType;
  isFaceUp?: boolean;
  isExhausted?: boolean;
  isDragging?: boolean;
  isSelected?: boolean;
  isLandscape?: boolean;
  isRune?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  tempMight?: number | null;
  onTempMightChange?: (delta: number) => void;
  onDoubleClick?: () => void;
  onViewDetails?: () => void;
}

const sizeClasses = {
  xs: "w-[77px]",   // 77x108 - battlefield
  sm: "w-[94px]",   // 94x132 - rune size
  md: "w-[120px]",  // 120x168 - standard
  lg: "w-[180px]",  // 180x252 - large (50% bigger than md)
};

const landscapeSizeClasses = {
  xs: "w-[108px] h-[77px]",
  sm: "w-[132px] h-[94px]",
  md: "w-[168px] h-[120px]",
  lg: "w-[252px] h-[180px]",
};

export function Card({
  card,
  isFaceUp = true,
  isExhausted = false,
  isDragging = false,
  isSelected = false,
  isLandscape = false,
  isRune = false,
  size = "md",
  tempMight,
  onTempMightChange,
  onDoubleClick,
  onViewDetails,
}: CardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Spacebar shortcut to view details when hovering
  useEffect(() => {
    if (!isHovered || !onViewDetails) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if a drawer/dialog is open
      if (document.querySelector('[data-vaul-drawer]') || document.querySelector('[role="dialog"]')) {
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        // Reset hover state so user needs to re-hover after drawer closes
        setIsHovered(false);
        onViewDetails();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, onViewDetails]);

  return (
    <div
      className={`
        relative rounded-lg overflow-hidden cursor-pointer
        transition-all duration-200 select-none
        ${isLandscape ? landscapeSizeClasses[size] : `card-aspect ${sizeClasses[size]}`}
        ${isExhausted ? "opacity-20" : ""}
        ${isDragging ? "opacity-50 scale-105" : ""}
        ${isSelected ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-board-bg" : ""}
        hover:scale-105 hover:z-10
      `}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isFaceUp && card.imageUrl && !imageError ? (
        <img
          src={card.imageUrl}
          alt={card.cardName}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImageError(true)}
          draggable={false}
        />
      ) : isFaceUp ? (
        // Fallback face-up display when no image
        <div className="w-full h-full bg-board-zone border border-board-border flex flex-col p-1">
          <div className="text-[8px] font-bold truncate">{card.cardName}</div>
          <div className="text-[6px] text-gray-400">{card.cardType}</div>
          {card.energy !== null && (
            <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-[8px] font-bold">
              {card.energy}
            </div>
          )}
          {card.might !== null && (
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold">
              {card.might}
            </div>
          )}
        </div>
      ) : (
        // Card back
        <img
          src={isRune ? "/rune-back.png" : "/card-back.png"}
          alt="Card back"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      )}

      {/* Buff/Debuff tab - shown when tempMight is set */}
      {tempMight !== undefined && tempMight !== null && (
        <div
          className="absolute left-0 right-0 bottom-1 z-20 text-center"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className={`inline-flex items-center justify-between bg-board-zone rounded-full px-1 shadow-lg border border-gold ${size === "xs" ? "w-[50px]" : "w-[60px]"}`}>
            {onTempMightChange && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTempMightChange(-1);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-gold/50 hover:text-gold text-[10px] font-bold leading-none"
              >
                −
              </button>
            )}
            <span className="text-gold font-bold text-[10px] text-center leading-none py-0.5 flex-1">
              {tempMight > 0 ? `+${tempMight}` : tempMight}
            </span>
            {onTempMightChange && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTempMightChange(1);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-gold/50 hover:text-gold text-[10px] font-bold leading-none"
              >
                +
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
