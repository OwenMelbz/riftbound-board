"use client";

import { useRef, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the confirm button when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure dialog is mounted
      const timer = setTimeout(() => {
        confirmRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-board-zone border-board-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-100">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-board-bg border-board-border text-gray-300 hover:bg-board-hover hover:text-gray-100">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            ref={confirmRef}
            onClick={handleConfirm}
            className={
              variant === "destructive"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gold text-board-bg hover:bg-gold-light"
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
