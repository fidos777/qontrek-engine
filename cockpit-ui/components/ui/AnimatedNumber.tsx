"use client";
import { useCountUpValue } from "@/lib/hooks/useCountUpValue";

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const count = useCountUpValue(value, 2000);
const formatted = decimals === 0 
    ? Math.floor(count).toLocaleString()
    : count.toFixed(decimals);

return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
