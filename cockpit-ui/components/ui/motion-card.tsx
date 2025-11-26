"use client";

import { motion } from "framer-motion";
import { Card } from "./card";
import { forwardRef } from "react";

interface MotionCardProps extends React.ComponentProps<typeof Card> {
  delay?: number;
  hover?: boolean;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ children, delay = 0, hover = true, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={hover ? {
          scale: 1.02,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          transition: { duration: 0.2 }
        } : undefined}
      >
        <Card className={className} {...props}>
          {children}
        </Card>
      </motion.div>
    );
  }
);

MotionCard.displayName = "MotionCard";
