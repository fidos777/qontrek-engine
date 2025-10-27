import confetti from "canvas-confetti";
import { toast } from "react-hot-toast";

export const handleDataLoad = (summary: any) => {
  // Called when G2 data loads successfully
  const totalRecoverable = summary?.total_recoverable || 0;
  const criticalLeadsCount = summary?.kpi?.critical_leads || 0;

  // Quiet success indicator (no toast unless it's a refresh action)
  if (totalRecoverable > 1_000_000) {
    console.log(`✓ Loaded RM ${(totalRecoverable / 1_000_000).toFixed(1)}M recoverable pipeline`);
  }
};

export const handleRefreshSuccess = (summary: any) => {
  // Show toast on manual refresh
  const totalRecoverable = summary?.total_recoverable || 0;
  const formattedValue = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
  }).format(totalRecoverable);

  toast.success(
    `✅ Data refreshed • ${formattedValue} pipeline`,
    {
      duration: 3000,
      style: {
        background: 'var(--bg-card)',
        color: 'var(--text-1)',
        border: '1px solid var(--stroke)',
      }
    }
  );

  // Confetti for big pipeline
  if (totalRecoverable > 10_000_000) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#19c37d", "#5b8cff", "#6fe3ff"],
      });
    }
  }
};
