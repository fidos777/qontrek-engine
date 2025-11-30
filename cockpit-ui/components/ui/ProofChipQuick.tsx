"use client";

import React from 'react';
import { Shield } from 'lucide-react';

interface ProofChipCompactProps {
  onClick: () => void;
}

export function ProofChipCompact({ onClick }: ProofChipCompactProps) {
  return (
    <button
      onClick={onClick}
      className="proof-chip-compact"
      title="View proof"
      aria-label="View cryptographic proof"
    >
      <Shield size={14} />
    </button>
  );
}

// Add styles
const styles = `
  .proof-chip-compact {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    width: 20px;
    background: rgba(91, 140, 255, 0.1);
    border: 1px solid var(--accent);
    border-radius: 4px;
    color: var(--accent);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .proof-chip-compact:hover {
    background: rgba(91, 140, 255, 0.2);
    box-shadow: 0 0 8px rgba(91, 140, 255, 0.4);
  }

  .proof-chip-compact:active {
    transform: scale(0.95);
  }

  :root {
    --accent: #5b8cff;
    --bg-canvas: #0b1020;
    --bg-card: #111a2e;
    --bg-panel: #1a2540;
    --stroke: #1e2a44;
    --text-1: #e8eefb;
    --text-2: #b8c4e0;
    --text-3: #8aa0c9;
    --success: #19c37d;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined') {
  const styleId = 'proof-chip-styles';
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
}
