"use client";
import { useState, useEffect } from "react";
import { useReducedMotion } from "@/lib/motion";
import i18nProof from "@/i18n/proof.json";

type Lang = "BM" | "EN";

interface ProofModalProps {
  proofRef: string;
  label?: string;
  lang?: Lang;
}

function detectLocale(): Lang {
  if (typeof navigator === "undefined") return "EN";
  const browserLang = navigator.language || "";
  return browserLang.startsWith("ms") || browserLang.startsWith("bm") ? "BM" : "EN";
}

export function ProofModal({ proofRef, label, lang }: ProofModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [detectedLang, setDetectedLang] = useState<Lang>("EN");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setDetectedLang(lang || detectLocale());
  }, [lang]);

  const labels = i18nProof[detectedLang];
  const displayLabel = label || labels.openProof;

  async function fetchProof() {
    setLoading(true);
    try {
      const res = await fetch(`/api/proof?ref=${encodeURIComponent(proofRef)}`);
      if (!res.ok) throw new Error("Failed to fetch proof");
      const json = await res.json();
      setContent(JSON.stringify(json, null, 2));
    } catch (err) {
      setContent(`${labels.failed}: ${proofRef}`);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setIsOpen(true);
    fetchProof();
  }

  function handleClose() {
    setIsOpen(false);
    setContent("");
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="text-xs px-2 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-300"
        aria-label={displayLabel}
      >
        {labels.openProof}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-modal-title"
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto ${
          reducedMotion ? "" : "animate-fade-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="proof-modal-title" className="text-lg font-semibold">
            {displayLabel}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-gray-300 rounded p-1"
            aria-label={labels.close}
          >
            ✕
          </button>
        </div>
        <div className="text-sm text-gray-600 mb-2">
          <code className="bg-gray-100 px-2 py-1 rounded">{proofRef}</code>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">{labels.loading}</div>
        ) : (
          <pre className="bg-gray-100 dark:bg-slate-800 p-4 rounded overflow-x-auto text-xs">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
