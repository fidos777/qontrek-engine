"use client";

// components/trust/ProofChipV3.tsx
// ProofChipV3 + ProofModalMini - JSONPath Deep-Link + Drift Banner

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JSONPath } from 'jsonpath-plus';
import { canonicalStringify, sha256Browser, verifyHash } from '@/lib/trust/canonical';

// ============================================================================
// Types
// ============================================================================

export interface ProofChipV3Props {
  refName: string;                 // e.g. "pipeline.total"
  proofRef: string;                // e.g. "/proof/g2_dashboard_v19.1.json#$.summary.total_recoverable"
  label?: string;
  expectedSha256?: string;         // optional for drift detection
  className?: string;
}

interface ModalState {
  isOpen: boolean;
  refName: string;
  proofRef: string;
  expectedSha256?: string;
  invokerElement: HTMLElement | null;
}

interface ProofData {
  fullJson: any;
  resolvedNode: any;
  jsonPath: string;
  fileName: string;
  hasDrift: boolean;
  actualHash?: string;
}

// ============================================================================
// Modal Context (Singleton Controller)
// ============================================================================

const ModalContext = React.createContext<{
  openModal: (state: Omit<ModalState, 'isOpen'>) => void;
  closeModal: () => void;
} | null>(null);

// ============================================================================
// Telemetry
// ============================================================================

function logProofChipEvent(event: string, data: Record<string, any>) {
  const timestamp = new Date().toISOString();
  const entry = {
    event: `ui.proof_chip.${event}`,
    ...data,
    timestamp,
  };
  console.log('[TELEMETRY]', JSON.stringify(entry));
}

// ============================================================================
// ProofModalMini Component (Internal Singleton)
// ============================================================================

export function ProofModalMini(): JSX.Element {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    refName: '',
    proofRef: '',
    invokerElement: null,
  });

  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driftCheckPending, setDriftCheckPending] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const driftTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openModal = useCallback((state: Omit<ModalState, 'isOpen'>) => {
    setModalState({ ...state, isOpen: true });
    logProofChipEvent('open', { refName: state.refName, proofRef: state.proofRef });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    setProofData(null);
    setError(null);
    setDriftCheckPending(false);
    setCopySuccess(false);

    // Return focus to invoker
    if (modalState.invokerElement) {
      modalState.invokerElement.focus();
    }

    // Clear drift timeout
    if (driftTimeoutRef.current) {
      clearTimeout(driftTimeoutRef.current);
      driftTimeoutRef.current = null;
    }
  }, [modalState.invokerElement]);

  // Fetch and resolve proof data
  useEffect(() => {
    if (!modalState.isOpen) return;

    const fetchProof = async () => {
      setLoading(true);
      setError(null);
      setDriftCheckPending(!!modalState.expectedSha256);

      try {
        // Parse proofRef: "/proof/file.json#$.path.to.node"
        const [filePath, jsonPathStr] = modalState.proofRef.split('#');
        if (!filePath || !jsonPathStr) {
          throw new Error('Invalid proofRef format. Expected: /proof/file.json#$.path');
        }

        const fileName = filePath.split('/').pop() || filePath;

        // Fetch the JSON file
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
        }

        const fullJson = await response.json();

        // Resolve JSONPath
        const results = JSONPath({ path: jsonPathStr, json: fullJson, wrap: false });
        const resolvedNode = results;

        if (resolvedNode === undefined) {
          throw new Error(`JSONPath "${jsonPathStr}" did not resolve to any value`);
        }

        // Drift detection (debounced by 500ms)
        let hasDrift = false;
        let actualHash: string | undefined;

        if (modalState.expectedSha256) {
          actualHash = await sha256Browser(canonicalStringify(resolvedNode));
          hasDrift = actualHash !== modalState.expectedSha256;

          // Debounce drift banner (only show after 500ms)
          driftTimeoutRef.current = setTimeout(() => {
            setDriftCheckPending(false);
          }, 500);
        } else {
          setDriftCheckPending(false);
        }

        setProofData({
          fullJson,
          resolvedNode,
          jsonPath: jsonPathStr,
          fileName,
          hasDrift,
          actualHash,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setDriftCheckPending(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProof();

    return () => {
      if (driftTimeoutRef.current) {
        clearTimeout(driftTimeoutRef.current);
      }
    };
  }, [modalState.isOpen, modalState.proofRef, modalState.expectedSha256]);

  // Keyboard navigation (Esc to close)
  useEffect(() => {
    if (!modalState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalState.isOpen, closeModal]);

  // Focus management
  useEffect(() => {
    if (modalState.isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [modalState.isOpen]);

  // Copy deep-link
  const handleCopyDeepLink = useCallback(() => {
    navigator.clipboard.writeText(modalState.proofRef).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      logProofChipEvent('copy_deeplink', { proofRef: modalState.proofRef });
    });
  }, [modalState.proofRef]);

  // Syntax highlighting (simple JSON pretty-print with highlighting)
  const renderJsonWithHighlight = (data: any) => {
    const jsonStr = JSON.stringify(data, null, 2);
    return (
      <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-sm font-mono">
        <code className="text-gray-800">{jsonStr}</code>
      </pre>
    );
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      <AnimatePresence>
        {modalState.isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="proof-modal-title"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={closeModal}
            />

            {/* Modal */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 id="proof-modal-title" className="text-lg font-semibold text-gray-900">
                  Proof: {modalState.refName}
                </h2>
                <button
                  ref={closeButtonRef}
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>

              {/* Drift Banner (debounced, only shown after 500ms) */}
              {!driftCheckPending && proofData?.hasDrift && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="bg-yellow-50 border-l-4 border-yellow-400 p-4"
                  role="alert"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Drift detected:</strong> Expected hash does not match actual data
                      </p>
                      <p className="text-xs text-yellow-600 mt-1 font-mono">
                        Expected: {modalState.expectedSha256}
                      </p>
                      <p className="text-xs text-yellow-600 font-mono">
                        Actual: {proofData.actualHash}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading proof...</span>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {proofData && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">File</h3>
                      <p className="text-sm text-gray-600 font-mono">{proofData.fileName}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">JSONPath</h3>
                      <p className="text-sm text-gray-600 font-mono">{proofData.jsonPath}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Resolved Value</h3>
                      {renderJsonWithHighlight(proofData.resolvedNode)}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
                <button
                  onClick={handleCopyDeepLink}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                >
                  {copySuccess ? '✓ Copied!' : 'Copy Deep-Link'}
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

// ============================================================================
// ProofChipV3 Component
// ============================================================================

export function ProofChipV3({
  refName,
  proofRef,
  label,
  expectedSha256,
  className = '',
}: ProofChipV3Props): JSX.Element {
  const modalContext = React.useContext(ModalContext);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (modalContext) {
      modalContext.openModal({
        refName,
        proofRef,
        expectedSha256,
        invokerElement: buttonRef.current,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      ref={buttonRef}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${className}`}
      aria-label={`View proof for ${label || refName}`}
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span>{label || 'Proof'}</span>
    </button>
  );
}
