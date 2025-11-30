"use client";

import React, { useEffect } from 'react';
import { X, Copy, ExternalLink } from 'lucide-react';
import { ProofDatum, buildDeepLink, copyToClipboard, formatTimestamp } from '@/lib/utils/proof-helpers';

interface ProofModalQuickProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProofDatum;
}

export function ProofModalQuick({ isOpen, onClose, data }: ProofModalQuickProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains('proof-modal-overlay')) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);

    // Focus trap
    const modal = document.querySelector('.proof-modal-card');
    if (modal instanceof HTMLElement) {
      modal.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyHash = async () => {
    const success = await copyToClipboard(data.hash);
    if (success) {
      alert('Hash copied to clipboard!');
    }
  };

  const handleCopyDeepLink = async () => {
    const link = buildDeepLink(data);
    const success = await copyToClipboard(link);
    if (success) {
      alert('Deep link copied to clipboard!');
    }
  };

  return (
    <div className="proof-modal-overlay">
      <div className="proof-modal-card" tabIndex={-1}>
        <button className="proof-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <h2 className="proof-modal-title">Cryptographic Proof</h2>

        {data.drift && (
          <div className="proof-modal-warning">
            ⚠️ Expected vs Actual variance detected
          </div>
        )}

        <div className="proof-modal-content">
          <div className="proof-field">
            <label>Field Name</label>
            <div className="proof-value">{data.field}</div>
          </div>

          <div className="proof-field">
            <label>Value</label>
            <div className="proof-value">{String(data.value)}</div>
          </div>

          <div className="proof-field">
            <label>Hash</label>
            <div className="proof-value proof-hash">{data.hash}</div>
          </div>

          <div className="proof-field">
            <label>Timestamp</label>
            <div className="proof-value">{formatTimestamp(data.timestamp)}</div>
          </div>

          <div className="proof-field">
            <label>ETag</label>
            <div className="proof-value proof-hash">{data.etag}</div>
          </div>
        </div>

        <div className="proof-modal-actions">
          <button className="proof-btn proof-btn-secondary" onClick={handleCopyHash}>
            <Copy size={16} />
            Copy Hash
          </button>
          <button className="proof-btn proof-btn-secondary" onClick={handleCopyDeepLink}>
            <ExternalLink size={16} />
            Copy Deep Link
          </button>
          <button className="proof-btn proof-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .proof-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .proof-modal-card {
          background: var(--bg-card, #111a2e);
          border: 1px solid var(--stroke, #1e2a44);
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px;
          position: relative;
          outline: none;
        }

        .proof-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          color: var(--text-2, #b8c4e0);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .proof-modal-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .proof-modal-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-1, #e8eefb);
          margin: 0 0 16px 0;
        }

        .proof-modal-warning {
          background: rgba(255, 191, 0, 0.1);
          border: 1px solid rgba(255, 191, 0, 0.3);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
          color: #ffbf00;
          font-size: 14px;
        }

        .proof-modal-content {
          margin-bottom: 24px;
        }

        .proof-field {
          margin-bottom: 16px;
        }

        .proof-field label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-3, #8aa0c9);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .proof-value {
          background: var(--bg-panel, #1a2540);
          border: 1px solid var(--stroke, #1e2a44);
          border-radius: 4px;
          padding: 10px 12px;
          color: var(--text-1, #e8eefb);
          font-size: 14px;
        }

        .proof-hash {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          word-break: break-all;
        }

        .proof-modal-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .proof-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .proof-btn-primary {
          background: var(--accent, #5b8cff);
          color: white;
        }

        .proof-btn-primary:hover {
          background: #4a7aee;
        }

        .proof-btn-secondary {
          background: var(--bg-panel, #1a2540);
          color: var(--text-2, #b8c4e0);
          border: 1px solid var(--stroke, #1e2a44);
        }

        .proof-btn-secondary:hover {
          background: var(--stroke, #1e2a44);
        }
      `}</style>
    </div>
  );
}
