"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

interface CardSlotProps {
  id: string;
  label: string;
  children?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  isInverted?: boolean;
}

export function CardSlot({
  id,
  label,
  children,
  size = "md",
  className = "",
  isInverted = false,
}: CardSlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const sizeClasses = {
    sm: "w-[88px] h-[120px]",
    md: "w-[128px] h-[176px]",
    lg: "w-[168px] h-[232px]",
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        ${sizeClasses[size]}
        bg-board-zone rounded-lg border-2
        ${isOver ? "border-gold bg-gold/10" : "border-board-border"}
        flex items-center justify-center
        transition-colors duration-200
        ${className}
      `}
    >
      {children || (
        <span
          className="text-gold/50 text-xs text-center px-2"
          style={isInverted ? { transform: "rotate(180deg)" } : undefined}
        >
          {label}
        </span>
      )}
    </div>
  );
}
