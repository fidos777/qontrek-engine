// components/voltek/ImportWizardModal.tsx
// 4-step import wizard for Voltek Excel data

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { importVoltekExcel, type VoltekProject, type ValidationIssue } from "@/lib/data/ingest/voltek";
import { setSnapshot } from "@/lib/state/voltekStore";
import { emit } from "@/lib/events/bus";

export interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = "upload" | "review" | "validate" | "import";

interface WizardState {
  step: WizardStep;
  file: File | null;
  fileName: string;
  fileSize: string;
  dataset: VoltekProject[];
  issues: ValidationIssue[];
  isProcessing: boolean;
  error: string | null;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({ isOpen, onClose }) => {
  const [state, setState] = React.useState<WizardState>({
    step: "upload",
    file: null,
    fileName: "",
    fileSize: "",
    dataset: [],
    issues: [],
    isProcessing: false,
    error: null,
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setState({
        step: "upload",
        file: null,
        fileName: "",
        fileSize: "",
        dataset: [],
        issues: [],
        isProcessing: false,
        error: null,
      });
    }
  }, [isOpen]);

  // File selection handler
  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setState((s) => ({ ...s, error: "Please select an Excel file (.xlsx or .xls)" }));
      return;
    }

    setState((s) => ({
      ...s,
      file,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      isProcessing: true,
      error: null,
    }));

    try {
      const result = await importVoltekExcel(file);
      setState((s) => ({
        ...s,
        dataset: result.dataset,
        issues: result.issues,
        isProcessing: false,
        step: "review",
      }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        isProcessing: false,
        error: err?.message || "Failed to parse Excel file",
      }));
    }
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // File input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Navigate between steps
  const handleNext = () => {
    if (state.step === "upload") setState((s) => ({ ...s, step: "review" }));
    else if (state.step === "review") setState((s) => ({ ...s, step: "validate" }));
    else if (state.step === "validate") setState((s) => ({ ...s, step: "import" }));
  };

  const handleBack = () => {
    if (state.step === "review") setState((s) => ({ ...s, step: "upload" }));
    else if (state.step === "validate") setState((s) => ({ ...s, step: "review" }));
    else if (state.step === "import") setState((s) => ({ ...s, step: "validate" }));
  };

  // Final import action
  const handleImport = () => {
    try {
      const snapshot = setSnapshot(state.dataset, "import");

      // Emit event
      emit("import:completed", {
        count: snapshot.count,
        hash: snapshot.hash,
      });

      // Show success toast (simple implementation)
      alert(`Successfully imported ${snapshot.count} projects (hash: ${snapshot.hash})`);

      // Close modal
      onClose();
    } catch (err: any) {
      setState((s) => ({
        ...s,
        error: err?.message || "Failed to import data",
      }));
    }
  };

  // Progress calculation
  const stepProgress = {
    upload: 25,
    review: 50,
    validate: 75,
    import: 100,
  }[state.step];

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>Import Voltek Projects</DialogTitle>
      </DialogHeader>

      <DialogContent className="min-h-[400px]">
        {/* Progress bar */}
        <div className="mb-6">
          <Progress value={stepProgress} className="mb-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span className={state.step === "upload" ? "font-semibold text-gray-900" : ""}>
              Upload
            </span>
            <span className={state.step === "review" ? "font-semibold text-gray-900" : ""}>
              Review
            </span>
            <span className={state.step === "validate" ? "font-semibold text-gray-900" : ""}>
              Validate
            </span>
            <span className={state.step === "import" ? "font-semibold text-gray-900" : ""}>
              Import
            </span>
          </div>
        </div>

        {/* Error display */}
        {state.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {state.error}
          </div>
        )}

        {/* Step content with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {state.step === "upload" && (
              <UploadStep
                fileName={state.fileName}
                fileSize={state.fileSize}
                isProcessing={state.isProcessing}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onFileSelect={() => fileInputRef.current?.click()}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
              />
            )}

            {state.step === "review" && (
              <ReviewStep dataset={state.dataset.slice(0, 10)} totalCount={state.dataset.length} />
            )}

            {state.step === "validate" && (
              <ValidateStep issues={state.issues} totalRows={state.dataset.length} />
            )}

            {state.step === "import" && (
              <ImportStep
                count={state.dataset.length}
                issueCount={state.issues.length}
                fileName={state.fileName}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={state.isProcessing}>
          Cancel
        </Button>

        {state.step !== "upload" && state.step !== "import" && (
          <Button variant="secondary" onClick={handleBack} disabled={state.isProcessing}>
            Back
          </Button>
        )}

        {state.step === "upload" && state.file && !state.isProcessing && (
          <Button variant="primary" onClick={handleNext}>
            Next
          </Button>
        )}

        {(state.step === "review" || state.step === "validate") && (
          <Button variant="primary" onClick={handleNext} disabled={state.isProcessing}>
            Next
          </Button>
        )}

        {state.step === "import" && (
          <Button variant="primary" onClick={handleImport} disabled={state.isProcessing}>
            Import {state.dataset.length} Projects
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
};

// Step 1: Upload
interface UploadStepProps {
  fileName: string;
  fileSize: string;
  isProcessing: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadStep: React.FC<UploadStepProps> = ({
  fileName,
  fileSize,
  isProcessing,
  onDragOver,
  onDrop,
  onFileSelect,
  fileInputRef,
  onFileChange,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Upload your Voltek projects Excel file to begin the import process.
      </p>

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onFileSelect}
      >
        {isProcessing ? (
          <div className="py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Processing file...</p>
          </div>
        ) : fileName ? (
          <div className="py-4">
            <div className="text-4xl mb-2">📄</div>
            <p className="font-medium">{fileName}</p>
            <p className="text-sm text-gray-500">{fileSize}</p>
          </div>
        ) : (
          <div className="py-4">
            <div className="text-4xl mb-2">📤</div>
            <p className="font-medium mb-1">Drop Excel file here or click to select</p>
            <p className="text-sm text-gray-500">Supports .xlsx and .xls files</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
};

// Step 2: Review
interface ReviewStepProps {
  dataset: VoltekProject[];
  totalCount: number;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ dataset, totalCount }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Preview of first 10 projects (total: {totalCount})
      </p>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Client</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Budget</th>
              </tr>
            </thead>
            <tbody>
              {dataset.map((project, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">{project.id || "-"}</td>
                  <td className="px-3 py-2">{project.name || "-"}</td>
                  <td className="px-3 py-2">{project.client || "-"}</td>
                  <td className="px-3 py-2">
                    {project.status ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {project.status}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {project.budget ? `$${project.budget.toLocaleString()}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Step 3: Validate
interface ValidateStepProps {
  issues: ValidationIssue[];
  totalRows: number;
}

const ValidateStep: React.FC<ValidateStepProps> = ({ issues, totalRows }) => {
  const hasIssues = issues.length > 0;

  return (
    <div className="space-y-4">
      {hasIssues ? (
        <>
          <div className="flex items-center gap-2 text-yellow-800">
            <span className="text-xl">⚠️</span>
            <p className="font-medium">Found {issues.length} validation issues</p>
          </div>

          <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Row</th>
                  <th className="px-3 py-2 text-left font-medium">Field</th>
                  <th className="px-3 py-2 text-left font-medium">Issue</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">{issue.row}</td>
                    <td className="px-3 py-2 font-mono text-xs">{issue.field}</td>
                    <td className="px-3 py-2 text-gray-600">{issue.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-600">
            You can proceed with the import, but these rows may have incomplete data.
          </p>
        </>
      ) : (
        <div className="py-8 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-medium text-green-800 mb-1">All validations passed!</p>
          <p className="text-sm text-gray-600">
            {totalRows} projects are ready to import.
          </p>
        </div>
      )}
    </div>
  );
};

// Step 4: Import confirmation
interface ImportStepProps {
  count: number;
  issueCount: number;
  fileName: string;
}

const ImportStep: React.FC<ImportStepProps> = ({ count, issueCount, fileName }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Ready to import projects into the Voltek store.
      </p>

      <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Source file:</span>
          <span className="font-medium">{fileName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Projects to import:</span>
          <span className="font-medium">{count}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Validation issues:</span>
          <span className={issueCount > 0 ? "text-yellow-700 font-medium" : "text-green-700"}>
            {issueCount > 0 ? `${issueCount} warnings` : "None"}
          </span>
        </div>
      </div>

      {issueCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
          Note: Some rows have validation warnings but will still be imported.
        </div>
      )}

      <p className="text-sm text-gray-600">
        Click "Import" to seal the data snapshot and complete the import process.
      </p>
    </div>
  );
};

// Helper function
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default ImportWizardModal;
