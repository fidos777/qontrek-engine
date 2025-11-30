"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, LockOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSafeMode } from "@/contexts/SafeModeContext";
import toast from "react-hot-toast";

export function SafeModeToggle() {
  const { safeMode, toggleSafeMode } = useSafeMode();

  const handleToggle = () => {
    toggleSafeMode();
    
    if (!safeMode) {
      toast.success("🔒 Safe Mode enabled - Sensitive data masked", {
        duration: 3000,
      });
    } else {
      toast("🔓 Safe Mode disabled - Data visible", {
        duration: 3000,
      });
    }
  };

  return (
    <div 
      className="flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
      title={safeMode ? "Disable to show full names and sensitive data" : "Enable to mask names and sensitive information"}
    >
      <motion.div
        animate={safeMode ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {safeMode ? (
          <Lock size={20} className="text-green-600" />
        ) : (
          <LockOpen size={20} className="text-gray-400" />
        )}
      </motion.div>

      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          Safe Mode
        </span>
        <span className="text-xs text-gray-500">
          {safeMode ? "Data masked" : "Data visible"}
        </span>
      </div>

      <Switch
        checked={safeMode}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-green-600"
      />

      {safeMode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
        >
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="w-full h-full bg-green-500 rounded-full"
          />
        </motion.div>
      )}
    </div>
  );
}

// Compact version for header
export function SafeModeToggleCompact() {
  const { safeMode, toggleSafeMode } = useSafeMode();

  const handleToggle = () => {
    toggleSafeMode();
    
    if (!safeMode) {
      toast.success("🔒 Safe Mode ON", {
        duration: 2000,
      });
    } else {
      toast("🔓 Safe Mode OFF", {
        duration: 2000,
      });
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
        safeMode
          ? "border-green-500 bg-green-50 text-green-700"
          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
      }`}
      title={safeMode ? "Click to disable Safe Mode" : "Click to enable Safe Mode"}
    >
      <motion.div
        animate={safeMode ? { rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        {safeMode ? (
          <Lock size={18} />
        ) : (
          <LockOpen size={18} />
        )}
      </motion.div>
      
      <span className="text-sm font-medium">
        {safeMode ? "Safe Mode" : "Privacy"}
      </span>

      {safeMode && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
        >
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.3, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className="w-full h-full bg-green-500 rounded-full"
          />
        </motion.div>
      )}
    </button>
  );
}
