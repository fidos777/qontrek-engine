"use client";

import { X, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";

interface ProofModalQuickProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    field: string;
    value: any;
  };
}

export default function ProofModalQuick({
  isOpen,
  onClose,
  data
}: ProofModalQuickProps) {
  const [copied, setCopied] = useState(false);

  // Mock proof generation (realistic looking)
  const mockProof = {
    hash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
    etag: `W/"${Date.now()}"`,
    timestamp: new Date().toISOString(),
    verified: true,
    source: "voltek_pipeline_v1",
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(mockProof.hash);
    setCopied(true);
    toast.success("✓ Proof hash copied!", { duration: 2000 });
    setTimeout(() => setCopied(false), 2000);
  };

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 0.61, 0.36, 1]
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="proof-modal-title"
              className="bg-[var(--bg-card)] border border-[var(--stroke)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-emerald-600/20 to-emerald-700/20 border-b border-[var(--stroke)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-2xl"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      🔐
                    </motion.div>
                    <div>
                      <h3 id="proof-modal-title" className="font-bold text-lg text-[var(--text-1)]">
                        Cryptographic Proof
                      </h3>
                      <p className="text-xs text-[var(--text-3)]">
                        Lineage for <code className="text-emerald-400 bg-emerald-400/10 px-1 rounded">{data.field}</code>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-[var(--text-2)]" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--bg-panel)] p-3 rounded-lg border border-[var(--stroke-sub)]">
                    <div className="text-xs text-[var(--text-3)] mb-1 uppercase tracking-wide">Hash (SHA-256)</div>
                    <code className="text-xs text-[var(--text-2)] font-mono break-all block">
                      {mockProof.hash}
                    </code>
                  </div>

                  <div className="bg-[var(--bg-panel)] p-3 rounded-lg border border-[var(--stroke-sub)]">
                    <div className="text-xs text-[var(--text-3)] mb-1 uppercase tracking-wide">ETag</div>
                    <code className="text-xs text-[var(--text-2)] font-mono break-all">
                      {mockProof.etag}
                    </code>
                  </div>

                  <div className="bg-[var(--bg-panel)] p-3 rounded-lg border border-[var(--stroke-sub)]">
                    <div className="text-xs text-[var(--text-3)] mb-1 uppercase tracking-wide">Verified</div>
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {new Date(mockProof.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-[var(--bg-panel)] p-3 rounded-lg border border-[var(--stroke-sub)]">
                    <div className="text-xs text-[var(--text-3)] mb-1 uppercase tracking-wide">Source</div>
                    <code className="text-xs text-[var(--text-2)] font-mono">
                      {mockProof.source}
                    </code>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 border border-emerald-500/20">
                  <div className="text-xs text-emerald-400 mb-2 font-semibold">Proof Payload (JSON)</div>
                  <pre className="text-sm text-[var(--text-2)] font-mono overflow-x-auto">
{JSON.stringify({
  [data.field]: data.value,
  _meta: {
    hash: mockProof.hash,
    etag: mockProof.etag,
    verified: mockProof.verified,
    timestamp: mockProof.timestamp,
    source: mockProof.source,
  }
}, null, 2)}
                  </pre>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                  <div className="text-xs text-amber-400 font-medium">
                    🎭 Demo Mode: Proof UI complete, backend verification queued
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--stroke)] p-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleCopyHash}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[var(--accent)] text-white hover:bg-[color-mix(in_oklab,var(--accent),white_10%)]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Hash
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
