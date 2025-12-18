"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Card as CardType } from "@/lib/types";

// Context to share modifier key state across all cards
interface CardZoomContextType {
  modifierPressed: boolean;
}

const CardZoomContext = createContext<CardZoomContextType>({ modifierPressed: false });

export function CardZoomProvider({ children }: { children: ReactNode }) {
  const [modifierPressed, setModifierPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta" || e.key === "Alt") {
        setModifierPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta" || e.key === "Alt") {
        setModifierPressed(false);
      }
    };

    // Also reset if window loses focus
    const handleBlur = () => {
      setModifierPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return (
    <CardZoomContext.Provider value={{ modifierPressed }}>
      <TooltipProvider delayDuration={0}>
        {children}
      </TooltipProvider>
    </CardZoomContext.Provider>
  );
}

export function useModifierPressed() {
  return useContext(CardZoomContext).modifierPressed;
}

interface CardWithZoomProps {
  card: CardType;
  isFaceUp: boolean;
  isOwner?: boolean; // Whether the current player owns this card
  children: ReactNode;
}

export function CardWithZoom({ card, isFaceUp, isOwner = true, children }: CardWithZoomProps) {
  const modifierPressed = useModifierPressed();
  const [isHovered, setIsHovered] = useState(false);

  // Show zoom if face up OR if owner (owner can peek at their own face-down cards)
  const showZoom = modifierPressed && isHovered && (isFaceUp || isOwner);
  const isBattlefield = card.cardType === "Battlefield";

  return (
    <Tooltip open={showZoom}>
      <TooltipTrigger asChild>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={10}
        className="p-0 bg-transparent border-0"
      >
        <div className="rounded-lg overflow-hidden shadow-2xl border-2 border-gold/50">
          {card.imageUrl ? (
            isBattlefield ? (
              <div
                className="relative flex items-center justify-center bg-board-bg"
                style={{ width: "357px", height: "500px" }}
              >
                <img
                  src={card.imageUrl}
                  alt={card.cardName}
                  className="rotate-90"
                  style={{
                    height: "357px",
                    width: "auto",
                    minWidth: "500px",
                  }}
                />
              </div>
            ) : (
              <img
                src={card.imageUrl}
                alt={card.cardName}
                className="object-cover"
                style={{ width: "357px", height: "500px" }}
                draggable={false}
              />
            )
          ) : (
            <div
              className="bg-board-zone flex items-center justify-center"
              style={{ width: "357px", height: "500px" }}
            >
              <span className="text-gold/30">No image</span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
