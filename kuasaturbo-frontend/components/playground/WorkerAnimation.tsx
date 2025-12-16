"use client";

import { useEffect, useState } from "react";

interface WorkerStep {
  name: string;
  emoji: string;
}

const WORKER_STEPS: WorkerStep[] = [
  { name: "Planner", emoji: "📋" },
  { name: "Researcher", emoji: "🔍" },
  { name: "Creator", emoji: "🎨" },
  { name: "QC", emoji: "✅" },
];

interface WorkerAnimationProps {
  currentStep?: number;
}

export default function WorkerAnimation({ currentStep }: WorkerAnimationProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (currentStep !== undefined) {
      setActiveStep(currentStep);
      return;
    }

    // Auto-progress through steps
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < WORKER_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [currentStep]);

  return (
    <div className="py-8">
      <div className="text-center mb-6">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-primary mb-3"></div>
        <p className="text-slate-600 font-medium">AI workers sedang process...</p>
      </div>

      <div className="space-y-3">
        {WORKER_STEPS.map((step, index) => {
          const isActive = index === activeStep;
          const isComplete = index < activeStep;
          const isPending = index > activeStep;

          return (
            <div
              key={step.name}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive
                  ? "bg-primary/10 border-2 border-primary"
                  : isComplete
                  ? "bg-green-50 border-2 border-green-200"
                  : "bg-slate-50 border-2 border-slate-200"
              }`}
            >
              <div className="text-2xl">{step.emoji}</div>
              <div className="flex-1">
                <div className="font-medium text-slate-900">{step.name}</div>
              </div>
              <div>
                {isComplete && (
                  <span className="text-green-600 font-bold">✓</span>
                )}
                {isActive && (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                )}
                {isPending && (
                  <span className="text-slate-400">○</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-slate-500 text-center mt-4">
        Usually takes 2-4 seconds
      </p>
    </div>
  );
}
