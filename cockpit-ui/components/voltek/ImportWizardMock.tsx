"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Check, Loader2, X } from 'lucide-react';

interface ImportWizardMockProps {
  isOpen: boolean;
  onClose: () => void;
  onSeal: () => void;
}

export function ImportWizardMock({ isOpen, onClose, onSeal }: ImportWizardMockProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [canProceed, setCanProceed] = useState(false);
  const [isSealing, setIsSealing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedFile('');
      setCanProceed(false);
      setIsSealing(false);
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains('wizard-overlay')) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Auto-enable "Next" button after 800ms when entering a step
  useEffect(() => {
    if (!isOpen || currentStep === 4) return;

    setCanProceed(false);
    const timer = setTimeout(() => {
      setCanProceed(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file.name);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4) {
      handleSeal();
    }
  };

  const handleSeal = () => {
    setIsSealing(true);
    setTimeout(() => {
      onSeal();
      onClose();
    }, 800);
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-card">
        <button className="wizard-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <h2 className="wizard-title">Import Case Data</h2>

        {/* Progress Stepper */}
        <div className="wizard-stepper">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="wizard-step-item">
              <div className={`wizard-step-circle ${currentStep >= step ? 'active' : ''}`}>
                {currentStep > step ? <Check size={16} /> : step}
              </div>
              <div className="wizard-step-label">
                {step === 1 && 'Upload'}
                {step === 2 && 'Map'}
                {step === 3 && 'Validate'}
                {step === 4 && 'Seal'}
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="wizard-content">
          {currentStep === 1 && (
            <div className="wizard-step-content">
              <div className="wizard-upload-area">
                <Upload size={48} className="wizard-upload-icon" />
                <p className="wizard-upload-text">
                  {selectedFile || 'Choose file to upload'}
                </p>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleFileSelect}
                  className="wizard-file-input"
                />
                <p className="wizard-upload-hint">Accepts .xlsx or .csv files</p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="wizard-step-content">
              <h3 className="wizard-step-heading">Auto-mapped Fields</h3>
              <div className="wizard-mapping-list">
                <div className="wizard-mapping-item">
                  <span className="wizard-mapping-text">Name → customer_name</span>
                  <Check size={18} className="wizard-check-success" />
                </div>
                <div className="wizard-mapping-item">
                  <span className="wizard-mapping-text">Amount → total_recoverable</span>
                  <Check size={18} className="wizard-check-success" />
                </div>
                <div className="wizard-mapping-item">
                  <span className="wizard-mapping-text">Phone → contact_phone</span>
                  <Check size={18} className="wizard-check-success" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="wizard-step-content">
              <h3 className="wizard-step-heading">Validation Results</h3>
              <div className="wizard-validation-list">
                <div className="wizard-validation-item">
                  <Check size={18} className="wizard-check-success" />
                  <span>142 rows validated</span>
                </div>
                <div className="wizard-validation-item">
                  <Check size={18} className="wizard-check-success" />
                  <span>No duplicates found</span>
                </div>
                <div className="wizard-validation-item">
                  <Check size={18} className="wizard-check-success" />
                  <span>All required fields present</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="wizard-step-content wizard-seal-content">
              {isSealing ? (
                <>
                  <Loader2 size={48} className="wizard-spinner" />
                  <p className="wizard-seal-text">Generating cryptographic proof...</p>
                </>
              ) : (
                <>
                  <Check size={48} className="wizard-seal-icon" />
                  <p className="wizard-seal-text">Ready to seal</p>
                  <p className="wizard-seal-hint">
                    This will generate a cryptographic proof and import the data.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="wizard-actions">
          <button className="wizard-btn wizard-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="wizard-btn wizard-btn-primary"
            onClick={handleNext}
            disabled={!canProceed && currentStep !== 4}
          >
            {currentStep === 4 ? 'Seal & Import' : 'Next'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .wizard-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .wizard-card {
          background: var(--bg-card, #111a2e);
          border: 1px solid var(--stroke, #1e2a44);
          border-radius: 8px;
          max-width: 700px;
          width: 90%;
          padding: 32px;
          position: relative;
        }

        .wizard-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          color: var(--text-2, #b8c4e0);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .wizard-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .wizard-title {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-1, #e8eefb);
          margin: 0 0 32px 0;
        }

        .wizard-stepper {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
          position: relative;
        }

        .wizard-stepper::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 25%;
          right: 25%;
          height: 2px;
          background: var(--stroke, #1e2a44);
          z-index: 0;
        }

        .wizard-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .wizard-step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-panel, #1a2540);
          border: 2px solid var(--stroke, #1e2a44);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-3, #8aa0c9);
          font-weight: 600;
          transition: all 0.3s;
        }

        .wizard-step-circle.active {
          background: var(--accent, #5b8cff);
          border-color: var(--accent, #5b8cff);
          color: white;
        }

        .wizard-step-label {
          font-size: 12px;
          color: var(--text-3, #8aa0c9);
          font-weight: 500;
        }

        .wizard-content {
          min-height: 280px;
          margin-bottom: 32px;
        }

        .wizard-step-content {
          animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .wizard-upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          border: 2px dashed var(--stroke, #1e2a44);
          border-radius: 8px;
          background: var(--bg-panel, #1a2540);
          position: relative;
        }

        .wizard-upload-icon {
          color: var(--accent, #5b8cff);
          margin-bottom: 16px;
        }

        .wizard-upload-text {
          color: var(--text-1, #e8eefb);
          font-size: 16px;
          margin-bottom: 8px;
        }

        .wizard-upload-hint {
          color: var(--text-3, #8aa0c9);
          font-size: 12px;
        }

        .wizard-file-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .wizard-step-heading {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-1, #e8eefb);
          margin-bottom: 24px;
        }

        .wizard-mapping-list,
        .wizard-validation-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .wizard-mapping-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--bg-panel, #1a2540);
          border: 1px solid var(--stroke, #1e2a44);
          border-radius: 6px;
        }

        .wizard-mapping-text {
          font-family: 'Monaco', 'Menlo', monospace;
          color: var(--text-1, #e8eefb);
          font-size: 14px;
        }

        .wizard-check-success {
          color: var(--success, #19c37d);
        }

        .wizard-validation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg-panel, #1a2540);
          border: 1px solid var(--stroke, #1e2a44);
          border-radius: 6px;
          color: var(--text-1, #e8eefb);
        }

        .wizard-seal-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .wizard-spinner {
          color: var(--accent, #5b8cff);
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .wizard-seal-icon {
          color: var(--success, #19c37d);
          margin-bottom: 16px;
        }

        .wizard-seal-text {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-1, #e8eefb);
          margin-bottom: 8px;
        }

        .wizard-seal-hint {
          color: var(--text-3, #8aa0c9);
          font-size: 14px;
        }

        .wizard-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .wizard-btn {
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .wizard-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .wizard-btn-primary {
          background: var(--accent, #5b8cff);
          color: white;
        }

        .wizard-btn-primary:hover:not(:disabled) {
          background: #4a7aee;
        }

        .wizard-btn-secondary {
          background: var(--bg-panel, #1a2540);
          color: var(--text-2, #b8c4e0);
          border: 1px solid var(--stroke, #1e2a44);
        }

        .wizard-btn-secondary:hover {
          background: var(--stroke, #1e2a44);
        }
      `}</style>
    </div>
  );
}
