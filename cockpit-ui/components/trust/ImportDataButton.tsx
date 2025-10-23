// components/trust/ImportDataButton.tsx
// Header/Drawer CTA for Import Data flow

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ImportDataModal } from "./ImportDataModal";

export interface ImportDataButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ImportDataButton({
  variant = "default",
  size = "default",
  className = "",
}: ImportDataButtonProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsModalOpen(true)}
        aria-label="Import data from Excel, CSV, or DOCX"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        Import Data
      </Button>

      <ImportDataModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
