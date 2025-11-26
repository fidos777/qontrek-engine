"use client";

type ConfidenceMeterAnimatedProps = {
  trust?: number;
};

export default function ConfidenceMeterAnimated({ trust = 0 }: ConfidenceMeterAnimatedProps) {
  const clampedTrust = Math.max(0, Math.min(100, trust));

  const getColorClass = () => {
    if (clampedTrust >= 80) return "bg-green-500";
    if (clampedTrust >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
        <span className="text-sm font-semibold">{clampedTrust}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColorClass()} transition-all duration-500 ease-out`}
          style={{ width: `${clampedTrust}%` }}
        />
      </div>
    </div>
  );
}
