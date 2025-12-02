"use client";

type ProofFreshnessIndicatorProps = {
  lastUpdated?: Date | string | null;
  freshnessThresholdMinutes?: number;
  className?: string;
};

export default function ProofFreshnessIndicator({
  lastUpdated,
  freshnessThresholdMinutes = 60,
  className = ""
}: ProofFreshnessIndicatorProps) {
  const getMinutesAgo = (): number | null => {
    if (!lastUpdated) return null;
    const date = typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  };

  const minutesAgo = getMinutesAgo();

  const isFresh = minutesAgo !== null && minutesAgo <= freshnessThresholdMinutes;
  const isStale = minutesAgo !== null && minutesAgo > freshnessThresholdMinutes;

  const getStatusDisplay = () => {
    if (minutesAgo === null) {
      return { text: "No data", color: "text-gray-500", dot: "bg-gray-400" };
    }
    if (isFresh) {
      return {
        text: minutesAgo < 1 ? "Just now" : `${minutesAgo}m ago`,
        color: "text-green-600 dark:text-green-400",
        dot: "bg-green-500"
      };
    }
    return {
      text: `${minutesAgo}m ago`,
      color: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500"
    };
  };

  const status = getStatusDisplay();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${status.dot}`} />
      <span className={`text-sm ${status.color}`}>{status.text}</span>
      {isStale && (
        <span className="text-xs text-amber-600 dark:text-amber-400">(stale)</span>
      )}
    </div>
  );
}
