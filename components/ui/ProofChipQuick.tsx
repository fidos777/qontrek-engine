"use client";

import { Shield } from "lucide-react";
import { motion } from "framer-motion";

interface ProofChipQuickProps {
  onClick?: () => void;
  className?: string;
}

export default function ProofChipQuick({ onClick, className = "" }: ProofChipQuickProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md
        bg-emerald-50/10 border border-emerald-500/30 text-emerald-400
        text-xs font-medium cursor-pointer ${className}`}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 0 12px rgba(25,195,125,0.4)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.18,
        ease: [0.22, 0.61, 0.36, 1]
      }}
      title="View cryptographic proof"
    >
      <Shield className="w-3 h-3" />
      <span>Proof</span>
    </motion.button>
  );
}

export function ProofChipCompact({ onClick, className = "" }: ProofChipQuickProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full
        bg-emerald-50/10 border border-emerald-500/30 text-emerald-400
        cursor-pointer ${className}`}
      whileHover={{
        scale: 1.1,
        boxShadow: "0 0 12px rgba(25,195,125,0.4)"
      }}
      whileTap={{ scale: 0.95 }}
      transition={{
        duration: 0.18,
        ease: [0.22, 0.61, 0.36, 1]
      }}
      title="View proof"
    >
      <Shield className="w-3.5 h-3.5" />
    </motion.button>
  );
}
