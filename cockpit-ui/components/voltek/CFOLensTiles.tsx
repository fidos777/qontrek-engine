"use client";

import React from 'react';
import { ProofChipCompact } from '@/components/ui/ProofChipQuick';

interface CFOLensTilesProps {
  safeMode: boolean;
  onProofClick: (field: string, value: any) => void;
}

interface TileData {
  label: string;
  value: string;
  field: string;
}

const TILES: TileData[] = [
  { label: 'ROI', value: '32%', field: 'roi' },
  { label: 'Payback Period', value: '8 months', field: 'payback_period' },
  { label: 'Contribution Margin', value: 'RM 450K', field: 'contribution_margin' },
];

export function CFOLensTiles({ safeMode, onProofClick }: CFOLensTilesProps) {
  return (
    <div className="cfo-lens-container">
      {/* Left side: 3 tiles */}
      <div className="cfo-lens-tiles">
        {TILES.map((tile) => (
          <div key={tile.field} className="cfo-tile" title="Verified 45s ago">
            <div className="cfo-tile-header">
              <span className="cfo-tile-label">{tile.label}</span>
              <ProofChipCompact onClick={() => onProofClick(tile.field, tile.value)} />
            </div>
            <div className="cfo-tile-value">{tile.value}</div>
          </div>
        ))}
      </div>

      {/* Right side: PDF preview pane */}
      <div className="cfo-preview-pane">
        <div className="cfo-preview-content">
          <div className="cfo-preview-placeholder">PDF Preview</div>
          <p className="cfo-preview-text">Sample Financial Report</p>
        </div>
      </div>

      <style jsx>{`
        .cfo-lens-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          width: 100%;
        }

        .cfo-lens-tiles {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .cfo-tile {
          background: var(--bg-card, #111a2e);
          border: 1px solid var(--stroke, #1e2a44);
          border-radius: 8px;
          padding: 20px;
          transition: all 0.2s;
        }

        .cfo-tile:hover {
          border-color: var(--accent, #5b8cff);
          box-shadow: 0 4px 12px rgba(91, 140, 255, 0.15);
        }

        .cfo-tile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .cfo-tile-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-3, #8aa0c9);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cfo-tile-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-1, #e8eefb);
          line-height: 1.2;
        }

        .cfo-preview-pane {
          background: var(--bg-panel, #1a2540);
          border: 2px dashed var(--stroke, #1e2a44);
          border-radius: 8px;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cfo-preview-content {
          text-align: center;
        }

        .cfo-preview-placeholder {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-3, #8aa0c9);
          margin-bottom: 8px;
        }

        .cfo-preview-text {
          font-size: 14px;
          color: var(--text-3, #8aa0c9);
        }

        @media (max-width: 768px) {
          .cfo-lens-container {
            grid-template-columns: 1fr;
          }

          .cfo-preview-pane {
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
