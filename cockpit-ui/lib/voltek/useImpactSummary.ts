"use client";

import { useState, useEffect } from "react";
import { getSnapshot, getPrevSnapshot } from "./snapshotStore";
import type { Snapshot } from "./snapshotStore";

interface UseImpactSummaryReturn {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  beforeSnapshot: Snapshot | null;
  afterSnapshot: Snapshot | null;
}

/**
 * Hook to manage Impact Summary modal state
 *
 * Usage:
 * ```tsx
 * const impact = useImpactSummary();
 *
 * // Listen for import:completed event
 * useEffect(() => {
 *   const handleImportComplete = () => {
 *     impact.openModal();
 *   };
 *
 *   window.addEventListener('import:completed', handleImportComplete);
 *   return () => window.removeEventListener('import:completed', handleImportComplete);
 * }, []);
 *
 * // Render modal
 * <ImpactSummaryModal
 *   isOpen={impact.isOpen}
 *   onClose={impact.closeModal}
 *   before={impact.beforeSnapshot}
 *   after={impact.afterSnapshot}
 * />
 * ```
 */
export function useImpactSummary(): UseImpactSummaryReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [beforeSnapshot, setBeforeSnapshot] = useState<Snapshot | null>(null);
  const [afterSnapshot, setAfterSnapshot] = useState<Snapshot | null>(null);

  const openModal = () => {
    // Capture snapshots at the moment the modal opens
    setBeforeSnapshot(getPrevSnapshot());
    setAfterSnapshot(getSnapshot());
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    openModal,
    closeModal,
    beforeSnapshot,
    afterSnapshot,
  };
}

/**
 * Setup automatic modal trigger on import:completed event
 *
 * Usage in a parent component:
 * ```tsx
 * function MyApp() {
 *   const impact = useImpactSummary();
 *   useImportCompletedListener(impact.openModal);
 *
 *   return (
 *     <>
 *       <YourContent />
 *       <ImpactSummaryModal
 *         isOpen={impact.isOpen}
 *         onClose={impact.closeModal}
 *         before={impact.beforeSnapshot}
 *         after={impact.afterSnapshot}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function useImportCompletedListener(callback: () => void) {
  useEffect(() => {
    const handleImportComplete = () => {
      callback();
    };

    // Listen for custom import:completed event
    window.addEventListener("import:completed" as any, handleImportComplete);

    return () => {
      window.removeEventListener("import:completed" as any, handleImportComplete);
    };
  }, [callback]);
}

/**
 * Dispatch import:completed event
 *
 * Call this when an import operation completes:
 * ```ts
 * import { dispatchImportCompleted } from '@/lib/voltek/useImpactSummary';
 *
 * async function handleImport() {
 *   // ... do import work
 *   dispatchImportCompleted();
 * }
 * ```
 */
export function dispatchImportCompleted() {
  const event = new CustomEvent("import:completed");
  window.dispatchEvent(event);
}
