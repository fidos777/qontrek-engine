"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { useSafeMode } from '@/contexts/SafeMode';

const GATES = ['G13', 'G14', 'G15', 'G16', 'G17', 'G18'];

export function GovernanceStripCompact() {
  const { safeMode, setSafeMode } = useSafeMode();

  return (
    <div className="governance-strip">
      {/* Left side: Gate badges */}
      <div className="governance-badges">
        {GATES.map((gate) => (
          <div key={gate} className="governance-badge">
            <Check size={12} />
            <span>{gate}</span>
          </div>
        ))}
      </div>

      {/* Center: LIVE indicator */}
      <div className="governance-live">
        <div className="governance-live-dot" />
        <span>LIVE</span>
      </div>

      {/* Right side: Safe Mode toggle */}
      <div className="governance-safe-mode">
        <label className="governance-toggle-label">
          <input
            type="checkbox"
            checked={safeMode}
            onChange={(e) => setSafeMode(e.target.checked)}
            className="governance-checkbox"
          />
          <span className="governance-toggle-text">Safe Mode</span>
        </label>
      </div>

      <style jsx>{`
        .governance-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 60px;
          padding: 0 24px;
          background: var(--bg-card, #111a2e);
          border-bottom: 1px solid var(--stroke, #1e2a44);
        }

        .governance-badges {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .governance-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(25, 195, 125, 0.1);
          border: 1px solid var(--success, #19c37d);
          border-radius: 16px;
          color: var(--success, #19c37d);
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          font-weight: 600;
        }

        .governance-live {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--accent, #5b8cff);
        }

        .governance-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent, #5b8cff);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }

        .governance-safe-mode {
          display: flex;
          align-items: center;
        }

        .governance-toggle-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }

        .governance-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--accent, #5b8cff);
        }

        .governance-toggle-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-2, #b8c4e0);
        }

        @media (max-width: 768px) {
          .governance-strip {
            flex-direction: column;
            height: auto;
            padding: 16px;
            gap: 12px;
          }

          .governance-badges {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
