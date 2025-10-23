// components/trust/ImportDataModal.tsx
// 4-step import wizard: Upload → Mapping → Validate → Preview/Seal

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import type {
  ImportStep,
  ProfileType,
  ParsedData,
  ColumnMapping,
  ValidationError,
  G2Fixture,
} from "@/lib/import/types";
import { maskName, maskPhone } from "@/lib/import/types";
import {
  parseExcelFile,
  parseCSVFile,
  detectVoltekColumns,
  applyColumnMapping,
  buildG2Fixture,
  generateSampleTemplate,
  VOLTEK_COLUMNS,
} from "@/lib/import/voltekProfile";
import {
  parseDOCXFile,
  generateSiteSurveyTemplate,
} from "@/lib/import/docxSiteSurvey";
import {
  validateAllRows,
  VoltekLeadSchema,
  downloadErrorCSV,
} from "@/lib/import/validators";
import { proofStore } from "@/lib/proofStore";
import {
  logImportOpen,
  logImportValidate,
  logImportApply,
  logImportError,
} from "@/lib/import/telemetry";

export interface ImportDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS: ImportStep[] = [
  { id: 1, title: "Upload", status: "active" },
  { id: 2, title: "Map Columns", status: "pending" },
  { id: 3, title: "Validate", status: "pending" },
  { id: 4, title: "Preview & Seal", status: "pending" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS = 20000;

export function ImportDataModal({ open, onOpenChange }: ImportDataModalProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [steps, setSteps] = React.useState<ImportStep[]>(STEPS);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [profile, setProfile] = React.useState<ProfileType>("voltek_v19_9");
  const [parsedData, setParsedData] = React.useState<ParsedData | null>(null);
  const [columnMappings, setColumnMappings] = React.useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = React.useState<ValidationError[]>([]);
  const [mappedRows, setMappedRows] = React.useState<Array<Record<string, any>>>([]);
  const [fixture, setFixture] = React.useState<G2Fixture | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [safeMode, setSafeMode] = React.useState(true);

  // Reset when modal closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setCurrentStep(1);
        setSteps(STEPS);
        setSelectedFile(null);
        setParsedData(null);
        setColumnMappings([]);
        setValidationErrors([]);
        setMappedRows([]);
        setFixture(null);
        setError(null);
      }, 300); // After close animation
    } else {
      logImportOpen(profile);
    }
  }, [open, profile]);

  // Update step status
  const updateStepStatus = (stepId: number, status: ImportStep["status"]) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status } : s))
    );
  };

  // Step 1: Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 5MB limit");
      logImportError("File too large", "upload");
      return;
    }

    // Validate file type
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "csv", "docx"].includes(ext || "")) {
      setError("Invalid file type. Please upload .xlsx, .csv, or .docx");
      logImportError("Invalid file type", "upload");
      return;
    }

    setSelectedFile(file);

    try {
      let data: ParsedData;

      if (ext === "xlsx") {
        data = await parseExcelFile(file);
      } else if (ext === "csv") {
        data = await parseCSVFile(file);
      } else {
        // DOCX - site survey
        const siteData = await parseDOCXFile(file);
        console.log("[INFO] DOCX parsed (stub):", siteData);
        setError("DOCX import is not yet fully implemented");
        return;
      }

      // Validate row count
      if (data.rows.length > MAX_ROWS) {
        setError(`Too many rows (${data.rows.length}). Maximum is ${MAX_ROWS}`);
        logImportError("Too many rows", "upload");
        return;
      }

      setParsedData(data);

      // Auto-detect columns for Voltek profile
      if (profile === "voltek_v19_9") {
        const detected = detectVoltekColumns(data.columns);
        setColumnMappings(detected);
      }

      // Move to next step
      updateStepStatus(1, "complete");
      updateStepStatus(2, "active");
      setCurrentStep(2);
    } catch (err: any) {
      setError(err?.message || "Failed to parse file");
      logImportError(err?.message || "Parse failed", "upload");
    }
  };

  // Step 2: Adjust column mapping
  const handleMappingChange = (sourceColumn: string, targetColumn: string) => {
    setColumnMappings((prev) => {
      const existing = prev.find((m) => m.source === sourceColumn);
      if (existing) {
        return prev.map((m) =>
          m.source === sourceColumn ? { ...m, target: targetColumn } : m
        );
      } else {
        return [...prev, { source: sourceColumn, target: targetColumn }];
      }
    });
  };

  const handleMappingNext = () => {
    if (!parsedData) return;

    const mapped = applyColumnMapping(parsedData, columnMappings);
    setMappedRows(mapped);

    updateStepStatus(2, "complete");
    updateStepStatus(3, "active");
    setCurrentStep(3);
  };

  // Step 3: Validate
  React.useEffect(() => {
    if (currentStep === 3 && mappedRows.length > 0) {
      const errors = validateAllRows(mappedRows, VoltekLeadSchema);
      setValidationErrors(errors);
      logImportValidate(mappedRows.length, errors.length);
    }
  }, [currentStep, mappedRows]);

  const handleValidationNext = () => {
    if (validationErrors.length > 0) {
      setError("Please fix validation errors before continuing");
      return;
    }

    // Build fixture
    const g2Fixture = buildG2Fixture(mappedRows);
    setFixture(g2Fixture);

    updateStepStatus(3, "complete");
    updateStepStatus(4, "active");
    setCurrentStep(4);
  };

  // Step 4: Preview & Seal
  const handleSealAndApply = () => {
    if (!fixture) return;

    // Update proof store
    proofStore.setFixture(fixture, { mode: "demo" });
    logImportApply(mappedRows.length, profile);

    // Close modal
    onOpenChange(false);

    // Trigger KPI animations (via proof.updated event)
    // The parent component should listen to proofStore.subscribe()
  };

  // Download sample template
  const handleDownloadTemplate = () => {
    if (profile === "voltek_v19_9") {
      generateSampleTemplate();
    } else {
      generateSiteSurveyTemplate();
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Profile
              </label>
              <Select
                value={profile}
                onChange={(e) => setProfile(e.target.value as ProfileType)}
              >
                <option value="voltek_v19_9">Voltek V19.9 (Leads/Payments)</option>
                <option value="vesb_prj_f0003_rev01">
                  VESB Site Survey (F0003 Rev01)
                </option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Upload File (.xlsx, .csv, .docx)
              </label>
              <Input
                type="file"
                accept=".xlsx,.csv,.docx"
                onChange={handleFileUpload}
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 5MB, 20k rows
              </p>
            </div>

            {selectedFile && (
              <Card className="p-3 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-600">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </Card>
            )}

            <button
              onClick={handleDownloadTemplate}
              className="text-sm text-blue-600 hover:underline"
            >
              Download sample template
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Auto-detected columns. Adjust mappings if needed:
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {parsedData?.columns.map((col) => {
                const mapping = columnMappings.find((m) => m.source === col);
                return (
                  <div key={col} className="flex items-center gap-2">
                    <div className="flex-1 text-sm font-medium">{col}</div>
                    <span className="text-gray-400">→</span>
                    <Select
                      value={mapping?.target || ""}
                      onChange={(e) => handleMappingChange(col, e.target.value)}
                      className="flex-1"
                    >
                      <option value="">Skip column</option>
                      {Object.keys(VOLTEK_COLUMNS).map((target) => (
                        <option key={target} value={target}>
                          {target}
                        </option>
                      ))}
                    </Select>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleMappingNext}>Next</Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {validationErrors.length === 0 ? (
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-sm font-medium text-green-800">
                    All rows valid! ({mappedRows.length} rows)
                  </p>
                </div>
              </Card>
            ) : (
              <>
                <Card className="p-4 bg-red-50 border-red-200">
                  <p className="text-sm font-medium text-red-800">
                    {validationErrors.length} validation errors found
                  </p>
                </Card>

                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left bg-gray-50">
                      <tr>
                        <th className="p-2">Row</th>
                        <th className="p-2">Column</th>
                        <th className="p-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationErrors.slice(0, 20).map((err, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{err.row}</td>
                          <td className="p-2">{err.column}</td>
                          <td className="p-2">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadErrorCSV(validationErrors)}
                >
                  Download Errors CSV
                </Button>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  updateStepStatus(3, "pending");
                  updateStepStatus(2, "active");
                  setCurrentStep(2);
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleValidationNext}
                disabled={validationErrors.length > 0}
              >
                Next
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Preview Mode</p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={safeMode}
                  onChange={(e) => setSafeMode(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Safe-Mode (mask PII)</span>
              </label>
            </div>

            <Card className="p-4 bg-gray-50">
              <h3 className="text-sm font-semibold mb-2">Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Total Recoverable:</div>
                <div className="font-medium">
                  MYR {fixture?.summary.total_recoverable.toLocaleString()}
                </div>
                <div>Pending 80%:</div>
                <div className="font-medium">
                  MYR {fixture?.summary.pending_80_value.toLocaleString()}
                </div>
                <div>Recovery Rate (7d):</div>
                <div className="font-medium">
                  {((fixture?.kpi.recovery_rate_7d || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </Card>

            <div>
              <h3 className="text-sm font-semibold mb-2">
                Critical Leads ({fixture?.critical_leads.length})
              </h3>
              <div className="max-h-40 overflow-y-auto text-xs">
                {fixture?.critical_leads.slice(0, 5).map((lead, idx) => (
                  <div key={idx} className="p-2 border-b">
                    <div className="font-medium">
                      {safeMode ? maskName(lead.name) : lead.name}
                    </div>
                    <div className="text-gray-600">
                      {lead.stage} · MYR {lead.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  updateStepStatus(4, "pending");
                  updateStepStatus(3, "active");
                  setCurrentStep(3);
                }}
              >
                Back
              </Button>
              <Button onClick={handleSealAndApply}>Seal & Apply</Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription>
            Upload Excel, CSV, or DOCX files to build proof fixtures
          </DialogDescription>
        </DialogHeader>

        {/* Step Progress */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.status === "complete"
                      ? "bg-green-600 text-white"
                      : step.status === "active"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.status === "complete" ? "✓" : step.id}
                </div>
                <div className="text-xs mt-1">{step.title}</div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-px bg-gray-300 mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        <div className="min-h-[300px]">{renderStepContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
