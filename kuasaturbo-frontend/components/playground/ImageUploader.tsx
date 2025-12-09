"use client";

import { useState } from "react";

interface ImageUploaderProps {
  uploadedImage: File | null;
  onUpload: (file: File | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImageUploader({ uploadedImage, onUpload, disabled }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError(null);

    if (!file) {
      onUpload(null);
      setPreview(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onUpload(file);
  };

  const handleClear = () => {
    onUpload(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div>
      {!uploadedImage ? (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-primary file:text-white
              hover:file:bg-primary/90
              file:cursor-pointer cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-slate-500 mt-2">
            Max 5MB • PNG, JPG, WEBP
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {preview && (
            <div className="relative rounded-lg overflow-hidden border-2 border-slate-200">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 truncate flex-1">
              {uploadedImage.name}
              <span className="text-slate-400 ml-2">
                ({(uploadedImage.size / 1024).toFixed(0)}KB)
              </span>
            </div>
            <button
              onClick={handleClear}
              disabled={disabled}
              className="ml-3 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
