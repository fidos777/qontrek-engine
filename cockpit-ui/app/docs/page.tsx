"use client";

import { useEffect, useState, useRef } from "react";
import type { DocsResponse } from "@/types/gates";
import { logProofLoad } from "@/lib/telemetry";
import { Card } from "@/components/ui/card";

async function fetchDocs(url: string): Promise<DocsResponse> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("not ok");
    return await res.json();
  } catch {
    // DEV-ONLY fallback to fixture (will not be bundled in production)
    if (process.env.NODE_ENV !== "production") {
      const mod = await import("@/tests/fixtures/docs.summary.json");
      return mod.default as unknown as DocsResponse;
    }
    throw new Error("Docs summary endpoint unavailable");
  }
}

export default function DocsPage() {
  const [payload, setPayload] = useState<DocsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const telemetrySent = useRef(false);

  useEffect(() => {
    fetchDocs("/api/docs/summary")
      .then((resp) => {
        setPayload(resp);
        // Telemetry guard (prevents double-fire in StrictMode)
        if (!telemetrySent.current && resp?.rel && resp?.source) {
          logProofLoad(resp.rel, resp.source);
          telemetrySent.current = true;
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-6"><p className="text-red-600" aria-live="polite">Error: {error}</p></div>;
  if (!payload) return <div className="p-6">Loading...</div>;

  const { data } = payload;
  const rawData = data as any; // Type assertion for additional properties not in frozen contract

  const fmNum = (v: unknown) => (typeof v === "number" ? v.toLocaleString("en-MY") : "-");
  const fmDT = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

  const tabs = ["Overview", "Lineage Map", "Integrity Check", "Timeline"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Document Tracker</h1>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b" role="tablist" aria-label="Document tracker tabs">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              role="tab"
              aria-selected={activeTab === idx}
              aria-controls={`tabpanel-${idx}`}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === idx
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}

        {/* Tab 1: Overview */}
        {activeTab === 0 && (
          <div role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Proof Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="border rounded p-4">
                  <div className="text-sm text-gray-500 mb-1">Total Proofs</div>
                  <div className="text-3xl font-semibold text-blue-600">{fmNum(rawData.total_proofs)}</div>
                </div>
                <div className="border rounded p-4">
                  <div className="text-sm text-gray-500 mb-1">Sealed</div>
                  <div className="text-3xl font-semibold text-green-600">{fmNum(rawData.sealed)}</div>
                </div>
                <div className="border rounded p-4">
                  <div className="text-sm text-gray-500 mb-1">Unsealed</div>
                  <div className="text-3xl font-semibold text-yellow-600">{fmNum(rawData.unsealed)}</div>
                </div>
                <div className="border rounded p-4">
                  <div className="text-sm text-gray-500 mb-1">Integrity Status</div>
                  <div className="text-lg font-semibold text-green-600">
                    {rawData.integrity?.valid || 0} Valid / {rawData.integrity?.invalid || 0} Invalid
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Recent Proofs</h2>
              <div className="space-y-3">
                {rawData.lineage && rawData.lineage.length > 0 ? (
                  rawData.lineage.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="font-medium text-gray-900">{item.gate} - {item.phase.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-gray-500">{item.proof}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                          item.status === "sealed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.timestamp ? fmDT.format(new Date(item.timestamp)) : "-"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No proof lineage data available.</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Lineage Map */}
        {activeTab === 1 && (
          <div role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Proof Lineage Hierarchy</h2>
              {rawData.lineage && rawData.lineage.length > 0 ? (
                <div className="space-y-4">
                  {rawData.lineage.map((item: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-blue-600">{item.gate}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === "sealed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="ml-4 space-y-1">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Phase:</span> {item.phase.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Proof:</span> <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{item.proof}</code>
                        </div>
                        {item.timestamp && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Generated:</span> {fmDT.format(new Date(item.timestamp))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No lineage data available.</p>
              )}
            </Card>
          </div>
        )}

        {/* Tab 3: Integrity Check */}
        {activeTab === 2 && (
          <div role="tabpanel" id="tabpanel-2" aria-labelledby="tab-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Seal Integrity Verification</h2>

              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-green-900">
                    All proofs verified: {rawData.integrity?.valid || 0} valid, {rawData.integrity?.invalid || 0} invalid
                  </span>
                </div>
              </div>

              {rawData.lineage && rawData.lineage.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left">
                      <tr>
                        <th scope="col" className="py-2 pr-4">Gate</th>
                        <th scope="col" className="py-2 pr-4">Proof File</th>
                        <th scope="col" className="py-2 pr-4">Status</th>
                        <th scope="col" className="py-2">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.lineage.map((item: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="py-2 pr-4 font-medium">{item.gate}</td>
                          <td className="py-2 pr-4">
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{item.proof.split('/').pop()}</code>
                          </td>
                          <td className="py-2 pr-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              item.status === "sealed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {item.status === "sealed" && (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2">
                            {item.timestamp ? fmDT.format(new Date(item.timestamp)) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No integrity data available.</p>
              )}
            </Card>
          </div>
        )}

        {/* Tab 4: Timeline */}
        {activeTab === 3 && (
          <div role="tabpanel" id="tabpanel-3" aria-labelledby="tab-3">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Proof Generation Timeline</h2>

              {/* Chart placeholder */}
              <div className="mb-6 p-8 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-600">Timeline Chart Placeholder</p>
                  <p className="text-xs text-gray-500 mt-1">(Recharts integration pending)</p>
                </div>
              </div>

              {rawData.timeline && rawData.timeline.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 mb-3">Timeline Events</h3>
                  {rawData.timeline.map((event: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 border-b pb-3">
                      <div className="w-32 text-sm text-gray-500 font-mono">
                        {event.timestamp ? fmDT.format(new Date(event.timestamp)) : "-"}
                      </div>
                      <div className="flex-1">
                        <code className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded">{event.event}</code>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No timeline data available.</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
