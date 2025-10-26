"use client";

interface ProofChipProps {
  hash: string;
  onClick?: () => void;
}

export function ProofChip({ hash, onClick }: ProofChipProps) {
  const truncatedHash = hash.length > 12 ? `${hash.slice(0, 8)}...${hash.slice(-4)}` : hash;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1 text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
      title={`View proof: ${hash}`}
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
      <span>{truncatedHash}</span>
    </button>
  );
}
