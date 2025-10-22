// app/components/SystemPulse.tsx
"use client";
import { useEffect, useState } from "react";

interface SystemPulseProps {
  refName?: string;
  onOpen?: (ref: string) => void;
}

export default function SystemPulse({
  refName = "voltek_upload_v19_9.json",
  onOpen
}: SystemPulseProps) {
  const [pulse, setPulse] = useState("— · Loading");
  const [etag, setEtag] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);

    fetch(`/api/proof?ref=${encodeURIComponent(refName)}`, {
      method: "HEAD",
      signal: ctrl.signal
    })
      .then(r => {
        const e = r.headers.get("etag");
        if (e) {
          setEtag(e);
          setPulse(`${e.slice(3, 13)} · Tower ✅`);
        } else {
          setPulse("— · No ETag");
        }
      })
      .catch(() => {
        setPulse("— · Offline");
      })
      .finally(() => {
        clearTimeout(t);
      });

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [refName]);

  const handleClick = () => {
    if (onOpen) {
      onOpen(refName);
    }
  };

  return (
    <span
      aria-live="polite"
      title={`Latest proof ETag: ${etag ?? "unavailable"}${onOpen ? " (click to open lineage)" : ""}`}
      onClick={onOpen ? handleClick : undefined}
      className={`text-xs text-slate-500 ${onOpen ? "cursor-pointer hover:text-slate-700" : ""}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={onOpen ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      {pulse}
    </span>
  );
}
