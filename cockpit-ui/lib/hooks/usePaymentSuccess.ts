import { useEffect } from "react";
import { triggerConfetti, showSuccessToast } from "@/lib/utils/toast-helpers";

interface PaymentSuccessLead {
  name?: string;
  amount?: number;
  paid_at?: string;
  [key: string]: unknown;
}

/**
 * Hook to show confetti and toast notifications for recent payment successes
 * Automatically triggers when payments were made within the last 5 minutes
 * @param recentSuccess - Array of recent successful payment leads
 */
export function usePaymentSuccess(recentSuccess: PaymentSuccessLead[]) {
  useEffect(() => {
    if (!recentSuccess || recentSuccess.length === 0) return;

    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes in milliseconds

    // Filter for payments made within the last 5 minutes
    const recent = recentSuccess.filter((s) => {
      if (!s.paid_at) return false;
      const paidTime = new Date(s.paid_at).getTime();
      return paidTime > fiveMinutesAgo && paidTime <= now;
    });

    if (recent.length > 0) {
      // Get the most recent payment (first item is assumed to be latest)
      const latest = recent[0];
      const name = latest.name || "Customer";
      const amount = latest.amount || 0;

      const fmMYR = new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
      });

      // Trigger confetti animation
      triggerConfetti();

      // Show success toast
      showSuccessToast(`🎉 ${name} just paid ${fmMYR.format(amount)}!`);
    }
  }, [recentSuccess]);
}
