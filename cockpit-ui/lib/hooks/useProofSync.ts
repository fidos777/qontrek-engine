import { useEffect } from "react";
import { showProofSyncToast } from "@/lib/utils/toast-helpers";

/**
 * Hook to listen for proof.updated events and show sync notification
 * Automatically displays a toast when proof data is synchronized
 */
export function useProofSync() {
  useEffect(() => {
    const handler = () => {
      showProofSyncToast();
    };

    // Listen for custom proof.updated event
    window.addEventListener("proof.updated", handler);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("proof.updated", handler);
    };
  }, []);
}
