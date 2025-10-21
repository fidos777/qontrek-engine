"use client";
import { useState } from "react";

export default function UploadPage() {
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<File|null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("Uploading…");

    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_UPLOAD_TOKEN}` },
      body: data,
    });
    const json = await res.json();
    setStatus(json.ok ? `✅ Uploaded ${json.file}` : `❌ ${json.error}`);
  }

  return (
    <main className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Upload Latest Voltek Data</h1>
      <form onSubmit={handleUpload} className="space-y-4">
        <label htmlFor="fileInput" className="block text-sm font-medium text-slate-700">
          Choose File (.xlsx or .csv)
        </label>
        <input id="fileInput" type="file" aria-live="polite"
          accept=".xlsx,.csv"
          onChange={(e)=>setFile(e.target.files?.[0]||null)}
          className="block w-full border border-slate-300 rounded-md p-2" />
        <button type="submit"
          className="bg-orange-600 text-white px-4 py-2 rounded-md focus:ring focus:ring-orange-300">
          Upload & Rebuild
        </button>
      </form>
      <p aria-live="polite" className="text-sm text-slate-600">{status}</p>
    </main>
  );
}
