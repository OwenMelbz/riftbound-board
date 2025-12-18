"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface PerspectiveState {
  rotateX: number;
  rotateY: number;
}

interface UseBoardPerspectiveOptions {
  maxRotation?: number; // Maximum rotation in degrees
  sensitivity?: number; // How much rotation per pixel of mouse movement
}

export function useBoardPerspective(options: UseBoardPerspectiveOptions = {}) {
  const { maxRotation = 75, sensitivity = 0.3 } = options;

  const [perspective, setPerspective] = useState<PerspectiveState>({
    rotateX: 0,
    rotateY: 0,
  });
  const [isAdjusting, setIsAdjusting] = useState(false);

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const startPerspective = useRef<PerspectiveState>({ rotateX: 0, rotateY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse button (button 1)
    if (e.button === 1) {
      e.preventDefault();
      setIsAdjusting(true);
      startPos.current = { x: e.clientX, y: e.clientY };
      startPerspective.current = { ...perspective };
    }
  }, [perspective]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isAdjusting || !startPos.current) return;

      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      // Invert Y for natural feeling (drag down = tilt toward you)
      const newRotateX = Math.max(
        -maxRotation,
        Math.min(maxRotation, startPerspective.current.rotateX - deltaY * sensitivity)
      );
      const newRotateY = Math.max(
        -maxRotation,
        Math.min(maxRotation, startPerspective.current.rotateY + deltaX * sensitivity)
      );

      setPerspective({
        rotateX: newRotateX,
        rotateY: newRotateY,
      });
    },
    [isAdjusting, maxRotation, sensitivity]
  );

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (e.button === 1) {
      setIsAdjusting(false);
      startPos.current = null;
    }
  }, []);

  const resetPerspective = useCallback(() => {
    setPerspective({ rotateX: 0, rotateY: 0 });
  }, []);

  // Add global mouse listeners when adjusting
  useEffect(() => {
    if (isAdjusting) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isAdjusting, handleMouseMove, handleMouseUp]);

  // Prevent context menu on middle click
  useEffect(() => {
    const preventMiddleClickScroll = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    // Prevent the auto-scroll behavior on middle click
    window.addEventListener("mousedown", preventMiddleClickScroll);

    return () => {
      window.removeEventListener("mousedown", preventMiddleClickScroll);
    };
  }, []);

  const perspectiveStyle: React.CSSProperties = {
    transform: `perspective(1500px) rotateX(${perspective.rotateX}deg) rotateY(${perspective.rotateY}deg)`,
    transformStyle: "preserve-3d",
    transition: isAdjusting ? "none" : "transform 0.3s ease-out",
  };

  return {
    perspective,
    isAdjusting,
    perspectiveStyle,
    handleMouseDown,
    resetPerspective,
  };
}
