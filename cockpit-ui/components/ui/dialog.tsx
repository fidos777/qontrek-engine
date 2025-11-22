// components/ui/dialog.tsx
// Simple Dialog/Modal component using Tailwind CSS

'use client';

import * as React from "react";
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

interface DialogTitleProps {
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className = "" }: DialogContentProps) {
  return (
    <div className={`relative bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[85vh] overflow-auto ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div className="p-4 border-b">
      {children}
    </div>
  );
}

export function DialogTitle({ children }: DialogTitleProps) {
  return (
    <h2 className="text-lg font-semibold">
      {children}
    </h2>
  );
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 p-1 rounded-sm hover:bg-gray-100"
    >
      <X size={16} />
    </button>
  );
}
