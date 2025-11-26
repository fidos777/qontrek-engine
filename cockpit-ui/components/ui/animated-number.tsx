"use client";

import { motion } from "framer-motion";
import { useCountUp } from "@/lib/hooks/useCountUp";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
  className?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.2,
  delay = 0,
  className = "",
  formatOptions,
}: AnimatedNumberProps) {
  const animatedValue = useCountUp({ end: value, duration, delay, decimals });

  const formattedValue = formatOptions
    ? new Intl.NumberFormat("en-MY", formatOptions).format(animatedValue)
    : animatedValue.toLocaleString("en-MY");

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      {prefix}{formattedValue}{suffix}
    </motion.span>
  );
}
