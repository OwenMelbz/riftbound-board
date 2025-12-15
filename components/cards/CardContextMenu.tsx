"use client";

import { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface ContextMenuAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  shortcut?: string;
}

interface CardContextMenuProps {
  children: ReactNode;
  actions: ContextMenuAction[];
}

export function CardContextMenu({ children, actions }: CardContextMenuProps) {
  if (actions.length === 0) {
    return <>{children}</>;
  }

  // Separate "View Details" from other actions
  const viewDetailsAction = actions.find(a => a.label === "View Details");
  const otherActions = actions.filter(a => a.label !== "View Details");

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-board-zone border-board-border min-w-[160px]">
        {otherActions.map((action, i) => (
          <ContextMenuItem
            key={i}
            onClick={action.onClick}
            disabled={action.disabled}
            variant={action.destructive ? "destructive" : "default"}
            className="text-gray-200 focus:bg-board-hover focus:text-gray-100"
          >
            {action.label}
            {action.shortcut && (
              <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>
            )}
          </ContextMenuItem>
        ))}
        {viewDetailsAction && (
          <>
            <ContextMenuSeparator className="bg-board-border" />
            <ContextMenuItem
              onClick={viewDetailsAction.onClick}
              disabled={viewDetailsAction.disabled}
              className="text-gray-200 focus:bg-board-hover focus:text-gray-100"
            >
              {viewDetailsAction.label}
              {viewDetailsAction.shortcut && (
                <ContextMenuShortcut>{viewDetailsAction.shortcut}</ContextMenuShortcut>
              )}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
