"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface BounceBadgeProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export function BounceBadge({ children, active = true, className = "" }: BounceBadgeProps) {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setShouldAnimate(!mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setShouldAnimate(!e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (!active || !shouldAnimate) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      className={className}
      animate={{
        scale: [1, 1.1, 1],
        rotate: [0, 3, -3, 0],
      }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 2,
      }}
    >
      {children}
    </motion.span>
  );
}
