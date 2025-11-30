"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SafeModeContextType {
  safeMode: boolean;
  toggleSafeMode: () => void;
  maskText: (text: string) => string;
}

const SafeModeContext = createContext<SafeModeContextType | undefined>(undefined);

export function SafeModeProvider({ children }: { children: ReactNode }) {
  const [safeMode, setSafeMode] = useState(false);

  const toggleSafeMode = () => {
    setSafeMode((prev) => !prev);
  };

  const maskText = (text: string): string => {
    if (!safeMode) return text;
    
    // Mask the text with bullets
    // Keep first 2 characters visible for context
    if (text.length <= 2) {
      return "••";
    }
    
    const visibleChars = Math.min(2, text.length);
    const maskedLength = Math.max(4, text.length - visibleChars);
    
    return text.substring(0, visibleChars) + "•".repeat(maskedLength);
  };

  return (
    <SafeModeContext.Provider value={{ safeMode, toggleSafeMode, maskText }}>
      {children}
    </SafeModeContext.Provider>
  );
}

export function useSafeMode() {
  const context = useContext(SafeModeContext);
  
  if (context === undefined) {
    throw new Error("useSafeMode must be used within a SafeModeProvider");
  }
  
  return context;
}
