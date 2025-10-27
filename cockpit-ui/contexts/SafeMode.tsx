"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SafeModeContextType {
  safeMode: boolean;
  setSafeMode: (value: boolean) => void;
}

const SafeModeContext = createContext<SafeModeContextType>({
  safeMode: false,
  setSafeMode: () => {},
});

export const useSafeMode = () => useContext(SafeModeContext);

export function SafeModeProvider({ children }: { children: ReactNode }) {
  const [safeMode, setSafeMode] = useState(false);
  
  return (
    <SafeModeContext.Provider value={{ safeMode, setSafeMode }}>
      {children}
    </SafeModeContext.Provider>
  );
}
