"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ProofFreshnessQuickProps {
  lastUpdated?: Date;
  className?: string;
}

export default function ProofFreshnessQuick({
  lastUpdated = new Date(),
  className = ""
}: ProofFreshnessQuickProps) {
  const [timeAgo, setTimeAgo] = useState("just now");

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdated.getTime();
      const diffSecs = Math.floor(diffMs / 1000);

      if (diffSecs < 5) {
        setTimeAgo("just now");
      } else if (diffSecs < 60) {
        setTimeAgo(`${diffSecs}s ago`);
      } else if (diffSecs < 3600) {
        setTimeAgo(`${Math.floor(diffSecs / 60)}m ago`);
      } else {
        setTimeAgo(`${Math.floor(diffSecs / 3600)}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className="w-2 h-2 rounded-full bg-[var(--success)]"
        animate={{
          opacity: [1, 0.5, 1],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <span className="text-xs text-[var(--text-3)]">
        Verified {timeAgo}
      </span>
    </div>
  );
}
