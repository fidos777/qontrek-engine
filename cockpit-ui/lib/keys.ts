// lib/keys.ts
// ⚠️ C3-COMPLIANT - Keyboard navigation utilities

"use client";

import { useEffect, useRef } from "react";

/**
 * Hook for Ctrl+N shortcuts (tab/step switching)
 * @param maxIndex - Maximum tab index (0-based)
 * @param onSwitch - Callback when tab is switched
 */
export function useCtrlNumberSwitch(
  maxIndex: number,
  onSwitch: (index: number) => void
): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+1 through Ctrl+9
      if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (index <= maxIndex) {
          onSwitch(index);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [maxIndex, onSwitch]);
}

/**
 * Hook for Escape key to close modals/drawers
 * @param onClose - Callback when Escape is pressed
 * @param enabled - Whether the hook is active (default: true)
 */
export function useEscapeClose(onClose: () => void, enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, enabled]);
}

/**
 * Hook to restore focus to trigger element when modal/drawer closes
 * @returns Ref for trigger element and function to restore focus
 */
export function useFocusReturn<T extends HTMLElement>(): {
  triggerRef: React.RefObject<T>;
  restoreFocus: () => void;
} {
  const triggerRef = useRef<T>(null);

  const restoreFocus = () => {
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  return { triggerRef, restoreFocus };
}

/**
 * Hook for arrow key navigation in lists
 * @param itemCount - Number of items in the list
 * @param onNavigate - Callback when navigation occurs
 */
export function useArrowNavigation(
  itemCount: number,
  onNavigate: (index: number) => void
): void {
  useEffect(() => {
    let currentIndex = 0;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, itemCount - 1);
        onNavigate(currentIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        onNavigate(currentIndex);
      } else if (e.key === "Home") {
        e.preventDefault();
        currentIndex = 0;
        onNavigate(currentIndex);
      } else if (e.key === "End") {
        e.preventDefault();
        currentIndex = itemCount - 1;
        onNavigate(currentIndex);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [itemCount, onNavigate]);
}

/**
 * Check if keyboard event matches a shortcut
 */
export function isShortcut(
  e: KeyboardEvent,
  key: string,
  modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean }
): boolean {
  const ctrlMatch = modifiers?.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
  const shiftMatch = modifiers?.shift ? e.shiftKey : !e.shiftKey;
  const altMatch = modifiers?.alt ? e.altKey : !e.altKey;

  return e.key.toLowerCase() === key.toLowerCase() && ctrlMatch && shiftMatch && altMatch;
}

/**
 * Trap focus within a modal/dialog
 * @param containerRef - Ref to the container element
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener("keydown", handler);
    return () => container.removeEventListener("keydown", handler);
  }, [containerRef]);
}
