"use client";
import { useState } from "react";

export default function UploadPage() {
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    setStatus("Uploading…");

    const res = await fetch("/api/upload", { method: "POST", body: data });
    const json = await res.json();
    setStatus(json.ok ? `✅ Uploaded ${json.file}` : `❌ ${json.error}`);
  }

  return (
    <main className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Upload Latest Voltek Data</h1>
      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="file"
          accept=".xlsx,.csv,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full border border-slate-300 rounded-md p-2"
        />
        <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded-md">
          Upload & Rebuild
        </button>
      </form>
      {status && <p className="text-sm text-slate-600">{status}</p>}
    </main>
  );
}
