'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  parseCSV,
  validateCSVData,
  CSVValidationResult,
  formatMYR,
} from '@/lib/utils/voltekCalculations';

type ImportStep = 'upload' | 'validate' | 'preview' | 'complete';

interface ParsedLead {
  company: string;
  contact: string;
  phone: string;
  email: string;
  amount: number;
}

export default function VoltekImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [validation, setValidation] = useState<CSVValidationResult | null>(null);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      setCsvData(rows);

      const validationResult = validateCSVData(rows);
      setValidation(validationResult);

      if (validationResult.isValid) {
        // Parse leads from CSV
        const headers = rows[0].map(h => h.toLowerCase().trim());
        const companyIdx = headers.indexOf('company');
        const contactIdx = headers.indexOf('contact');
        const phoneIdx = headers.indexOf('phone');
        const emailIdx = headers.indexOf('email');
        const amountIdx = headers.indexOf('amount');

        const leads: ParsedLead[] = rows.slice(1).map(row => ({
          company: row[companyIdx]?.trim() || '',
          contact: row[contactIdx]?.trim() || '',
          phone: row[phoneIdx]?.trim() || '',
          email: emailIdx >= 0 ? row[emailIdx]?.trim() || '' : '',
          amount: parseFloat(row[amountIdx]) || 0,
        }));

        setParsedLeads(leads);
        setStep('validate');
      } else {
        setStep('validate');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const handleImport = useCallback(() => {
    // In a real app, this would send data to an API
    setStep('complete');
  }, []);

  const resetImport = useCallback(() => {
    setStep('upload');
    setCsvData(null);
    setValidation(null);
    setParsedLeads([]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/gates/voltek"
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Import Leads</h1>
          <p className="text-gray-600 mt-1">
            Upload a CSV file to import leads into Voltek Recovery
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(['upload', 'validate', 'preview', 'complete'] as ImportStep[]).map((s, idx) => (
              <React.Fragment key={s}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === s
                        ? 'bg-blue-600 text-white'
                        : ['validate', 'preview', 'complete'].indexOf(step) > ['validate', 'preview', 'complete'].indexOf(s)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                    {s}
                  </span>
                </div>
                {idx < 3 && (
                  <div className="flex-1 h-0.5 bg-gray-200 mx-4">
                    <div
                      className={`h-full bg-blue-600 transition-all ${
                        ['validate', 'preview', 'complete'].indexOf(step) > idx
                          ? 'w-full'
                          : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          {step === 'upload' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Upload CSV File</h2>

              {/* CSV Format Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Required CSV Format
                </h3>
                <p className="text-sm text-blue-700 mb-2">
                  Your CSV must include these columns:
                </p>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded">
                  company, contact, phone, amount
                </code>
                <p className="text-sm text-blue-700 mt-2">
                  Optional: email, notes, status
                </p>
              </div>

              {/* Drag & Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".csv"
                      className="sr-only"
                      onChange={handleFileInput}
                    />
                  </label>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">CSV files only</p>
              </div>
            </div>
          )}

          {step === 'validate' && validation && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Validation Results</h2>

              {validation.isValid ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-800 font-medium">
                      CSV is valid! {validation.validRowCount} leads ready to import.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h3 className="text-red-800 font-medium mb-2">Validation Errors</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validation.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h3 className="text-yellow-800 font-medium mb-2">Warnings</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {validation.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={resetImport}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Upload Different File
                </button>
                {validation.isValid && (
                  <button
                    onClick={() => setStep('preview')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Continue to Preview
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Preview Import</h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Total amount to import:{' '}
                  <span className="font-semibold">
                    {formatMYR(parsedLeads.reduce((sum, l) => sum + l.amount, 0))}
                  </span>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedLeads.slice(0, 10).map((lead, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {lead.company}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {lead.contact}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {lead.phone}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatMYR(lead.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedLeads.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2 px-4">
                    ... and {parsedLeads.length - 10} more leads
                  </p>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setStep('validate')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Import {parsedLeads.length} Leads
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Import Complete!
              </h2>
              <p className="text-gray-600 mb-6">
                Successfully imported {parsedLeads.length} leads totaling{' '}
                {formatMYR(parsedLeads.reduce((sum, l) => sum + l.amount, 0))}
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={resetImport}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Import More
                </button>
                <Link
                  href="/gates/voltek"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
