import confetti from "canvas-confetti";
import { toast } from "react-hot-toast";

export const handleImportSuccess = (rowCount: number, totalValue: number) => {
  // Format value
  const formattedValue = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 0,
  }).format(totalValue);

  // Show success toast
  toast.success(
    `✅ Imported ${rowCount} leads • ${formattedValue} total pipeline`,
    {
      duration: 4000,
      style: {
        background: 'var(--bg-card)',
        color: 'var(--text-1)',
        border: '1px solid var(--stroke)',
      }
    }
  );

  // Confetti for big imports (> RM 1M)
  if (totalValue > 1_000_000) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!prefersReducedMotion) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#19c37d", "#5b8cff", "#6fe3ff"],
      });
    }
  }
};

export const openWhatsApp = (lead: any, companyName: string = "Voltek") => {
  const phone = lead.phone || lead.contact || "";
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const message = encodeURIComponent(
    `Hi ${lead.name}, this is ${companyName} regarding your solar installation project (${lead.value}). When would be a good time to discuss the next steps?`
  );
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
};
