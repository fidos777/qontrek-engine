"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SafeModeContextType {
  safeMode: boolean;
  setSafeMode: (enabled: boolean) => void;
}

const SafeModeContext = createContext<SafeModeContextType | undefined>(undefined);

export function SafeModeProvider({ children }: { children: ReactNode }) {
  const [safeMode, setSafeMode] = useState(false);

  return (
    <SafeModeContext.Provider value={{ safeMode, setSafeMode }}>
      {children}
    </SafeModeContext.Provider>
  );
}

export function useSafeMode() {
  const context = useContext(SafeModeContext);
  if (context === undefined) {
    throw new Error("useSafeMode must be used within SafeModeProvider");
  }
  return context;
}
