"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface PulseIndicatorProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "subtle" | "normal" | "strong";
}

export function PulseIndicator({
  children,
  className = "",
  intensity = "normal"
}: PulseIndicatorProps) {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldAnimate(!mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setShouldAnimate(!e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const scaleValues = {
    subtle: [1, 1.02, 1],
    normal: [1, 1.05, 1],
    strong: [1, 1.08, 1],
  };

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        scale: scaleValues[intensity],
        opacity: [0.9, 1, 0.9],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
