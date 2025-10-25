"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  GitMerge,
  CheckCircle2,
  Shield,
  ArrowRight,
  ArrowLeft,
  File,
  Check,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

interface ImportWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1, name: "Upload", icon: Upload, color: "from-blue-500 to-cyan-500" },
  { id: 2, name: "Map", icon: GitMerge, color: "from-cyan-500 to-teal-500" },
  { id: 3, name: "Validate", icon: CheckCircle2, color: "from-teal-500 to-green-500" },
  { id: 4, name: "Seal", icon: Shield, color: "from-green-500 to-emerald-500" },
];

export function ImportWizardModal({ open, onOpenChange, onComplete }: ImportWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSealing, setIsSealing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [mapComplete, setMapComplete] = useState(false);
  const [validateComplete, setValidateComplete] = useState(false);

  const handleNext = () => {
    if (currentStep < 4) {
      // Mark step as complete
      if (currentStep === 1) setUploadComplete(true);
      if (currentStep === 2) setMapComplete(true);
      if (currentStep === 3) setValidateComplete(true);
      
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSeal = async () => {
    setIsSealing(true);
    
    // Simulate sealing process
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10B981", "#059669", "#34D399"],
    });

    // Show success toast
    toast.success("✅ Data sealed successfully! Trust Index updated.", {
      duration: 4000,
      icon: "🔒",
    });

    setIsSealing(false);
    
    // Call completion callback
    if (onComplete) onComplete();
    
    // Close modal
    setTimeout(() => {
      onOpenChange(false);
      // Reset wizard for next use
      setCurrentStep(1);
      setUploadComplete(false);
      setMapComplete(false);
      setValidateComplete(false);
    }, 500);
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setUploadComplete(false);
    setMapComplete(false);
    setValidateComplete(false);
    setIsSealing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetWizard();
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="text-blue-600" size={24} />
            Import Data Wizard
          </DialogTitle>
          <DialogDescription>
            Upload, map, validate, and seal your data with cryptographic proof
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6 mt-4">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep >= step.id
                      ? "border-emerald-500 bg-gradient-to-br " + step.color + " text-white"
                      : "border-gray-300 bg-gray-100 text-gray-400"
                  }`}
                  animate={currentStep === step.id ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: currentStep === step.id ? Infinity : 0, repeatDelay: 1 }}
                >
                  {currentStep > step.id ? (
                    <Check size={24} />
                  ) : (
                    <step.icon size={24} />
                  )}
                </motion.div>
                <div className="text-xs font-medium text-center">
                  {step.name}
                </div>
              </div>
              
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-6">
                  <div
                    className={`h-full transition-all duration-500 ${
                      currentStep > step.id ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[280px]">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <StepUpload key="step1" onComplete={() => setUploadComplete(true)} />
            )}
            {currentStep === 2 && (
              <StepMap key="step2" onComplete={() => setMapComplete(true)} />
            )}
            {currentStep === 3 && (
              <StepValidate key="step3" onComplete={() => setValidateComplete(true)} />
            )}
            {currentStep === 4 && (
              <StepSeal key="step4" isSealing={isSealing} />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSealing}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSealing}
            >
              Cancel
            </Button>
            
            {currentStep < 4 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSeal}
                disabled={isSealing}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isSealing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Sealing...
                  </>
                ) : (
                  <>
                    <Shield size={16} className="mr-2" />
                    Seal Data
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Step 1: Upload
function StepUpload({ onComplete }: { onComplete: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleFileSelect = () => {
    // Simulate file upload
    setUploadedFile("recovery_data_Q4_2024.xlsx");
    onComplete();
    toast.success("File uploaded successfully!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div
        className={`border-2 border-dashed rounded-lg p-8 transition-all ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileSelect();
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <Upload size={48} className={isDragging ? "text-blue-600" : "text-gray-400"} />
          
          {uploadedFile ? (
            <div className="flex items-center gap-2 text-green-700">
              <Check size={20} />
              <span className="font-medium">{uploadedFile}</span>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700">Drop your file here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </div>
              <Button onClick={handleFileSelect}>
                <File size={16} className="mr-2" />
                Select File
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Accepted formats:</strong> .xlsx, .csv, .json
        </p>
      </div>
    </motion.div>
  );
}

// Step 2: Map
function StepMap({ onComplete }: { onComplete: () => void }) {
  React.useEffect(() => {
    // Auto-complete mapping after a short delay
    const timer = setTimeout(() => onComplete(), 500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const mappings = [
    { source: "Customer Name", target: "lead.name", status: "mapped" },
    { source: "Amount Due", target: "lead.amount", status: "mapped" },
    { source: "Days Overdue", target: "lead.days_overdue", status: "mapped" },
    { source: "Stage", target: "lead.stage", status: "mapped" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <p className="text-sm text-gray-600 mb-4">
        Auto-mapping detected fields to schema...
      </p>

      <div className="space-y-2">
        {mappings.map((mapping, index) => (
          <motion.div
            key={mapping.source}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <Badge variant="outline">{mapping.source}</Badge>
              <ArrowRight size={16} className="text-gray-400" />
              <Badge variant="secondary">{mapping.target}</Badge>
            </div>
            <CheckCircle2 size={20} className="text-green-600" />
          </motion.div>
        ))}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-green-800 flex items-center gap-2">
          <Check size={16} />
          All fields mapped successfully
        </p>
      </div>
    </motion.div>
  );
}

// Step 3: Validate
function StepValidate({ onComplete }: { onComplete: () => void }) {
  const [checks, setChecks] = React.useState([
    { name: "Schema validation", completed: false },
    { name: "Data type check", completed: false },
    { name: "Duplicate detection", completed: false },
    { name: "Referential integrity", completed: false },
  ]);

  React.useEffect(() => {
    // Simulate validation checks
    checks.forEach((_, index) => {
      setTimeout(() => {
        setChecks((prev) =>
          prev.map((check, i) =>
            i === index ? { ...check, completed: true } : check
          )
        );
        
        if (index === checks.length - 1) {
          onComplete();
        }
      }, (index + 1) * 400);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <p className="text-sm text-gray-600 mb-4">
        Running validation checks...
      </p>

      <div className="space-y-3">
        {checks.map((check, index) => (
          <motion.div
            key={check.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
          >
            <span className="text-sm font-medium">{check.name}</span>
            {check.completed ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle2 size={20} className="text-green-600" />
              </motion.div>
            ) : (
              <Loader2 size={20} className="text-blue-600 animate-spin" />
            )}
          </motion.div>
        ))}
      </div>

      {checks.every((c) => c.completed) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <p className="text-sm text-green-800 flex items-center gap-2">
            <Check size={16} />
            All validation checks passed
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// Step 4: Seal
function StepSeal({ isSealing }: { isSealing: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-lg">
            <Shield size={32} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to seal
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Your data has been validated and is ready to be sealed with cryptographic proof.
              This will:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                Generate immutable hash for audit trail
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                Update Trust Index to 100%
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                Create Federation acknowledgment receipt
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                Sync with Qontrek Tower for governance
              </li>
            </ul>
          </div>
        </div>
      </div>

      {isSealing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-900">Sealing in progress...</p>
              <p className="text-xs text-blue-700">Generating cryptographic proof</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
