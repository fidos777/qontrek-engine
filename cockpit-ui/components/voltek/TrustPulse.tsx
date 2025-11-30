"use client";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export default function TrustPulse({ strength = 1 }: { strength?: number }) {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      scale: [1, 1 + 0.02 * strength, 1],
      boxShadow: [
        "0 0 0 0 rgba(16,185,129,0.0)",
        "0 0 0 6px rgba(16,185,129,0.15)",
        "0 0 0 0 rgba(16,185,129,0.0)",
      ],
      transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
    });
  }, [controls, strength]);

  return (
    <motion.div
      aria-hidden
      animate={controls}
      className="absolute inset-0 rounded-xl pointer-events-none"
    />
  );
}

