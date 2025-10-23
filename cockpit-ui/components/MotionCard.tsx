"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { createTelemetry } from "@/lib/telemetryClient";
import { ComponentProps, useEffect } from "react";

const telemetry = createTelemetry();

interface MotionCardProps extends ComponentProps<typeof Card> {
  trackMotion?: boolean;
}

export default function MotionCard({ trackMotion = true, children, ...props }: MotionCardProps) {
  useEffect(() => {
    if (trackMotion) {
      telemetry.emit("ui.motion.update", {
        component: "MotionCard",
        action: "mount",
        timestamp: new Date().toISOString(),
      });
    }
  }, [trackMotion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onAnimationStart={() => {
        if (trackMotion) {
          telemetry.emit("ui.motion.update", {
            component: "MotionCard",
            action: "animation_start",
          });
        }
      }}
      onAnimationComplete={() => {
        if (trackMotion) {
          telemetry.emit("ui.motion.update", {
            component: "MotionCard",
            action: "animation_complete",
          });
        }
      }}
    >
      <Card {...props}>{children}</Card>
    </motion.div>
  );
}
