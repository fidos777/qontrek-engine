"use client";

import { useState } from "react";
import Card from "@/components/shared/Card";
import Input from "@/components/shared/Input";
import TaskSelector from "@/components/playground/TaskSelector";
import StyleSelector from "@/components/playground/StyleSelector";
import ImageUploader from "@/components/playground/ImageUploader";
import GenerateButton from "@/components/playground/GenerateButton";
import OutputDisplay from "@/components/playground/OutputDisplay";
import WorkerAnimation from "@/components/playground/WorkerAnimation";
import { generateCreative } from "@/lib/api";
import type { PlaygroundState, GenerateCreativeResponse } from "@/lib/types";

export default function PlaygroundPage() {
  // Form state
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  // Execution state
  const [state, setState] = useState<PlaygroundState>("idle");
  const [currentWorker, setCurrentWorker] = useState<number>(0);
  const [result, setResult] = useState<GenerateCreativeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedTask || !selectedStyle) return;

    // Reset state
    setState("processing");
    setCurrentWorker(0);
    setResult(null);
    setError(null);

    // Simulate worker progression
    const workerInterval = setInterval(() => {
      setCurrentWorker((prev) => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 600);

    try {
      // Call API
      const response = await generateCreative({
        task: selectedTask,
        style: selectedStyle,
        prompt: prompt || undefined,
        image: uploadedImage || undefined,
      });

      // Clear worker animation
      clearInterval(workerInterval);

      // Set result
      setResult(response);
      setState("complete");
    } catch (err) {
      clearInterval(workerInterval);
      setError(err instanceof Error ? err.message : "Generation failed");
      setState("error");
    }
  };

  const handleGenerateAnother = () => {
    // Reset to idle state but keep form values
    setState("idle");
    setResult(null);
    setError(null);
    setCurrentWorker(0);
  };

  const handleReset = () => {
    // Full reset
    setSelectedTask("");
    setSelectedStyle("");
    setPrompt("");
    setUploadedImage(null);
    setState("idle");
    setResult(null);
    setError(null);
    setCurrentWorker(0);
  };

  const isProcessing = state === "processing";
  const isComplete = state === "complete";
  const hasError = state === "error";

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Creative Playground</h1>
        <p className="text-xl text-slate-600">
          Try KuasaTurbo creative tasks. No API key required for demo.
        </p>
        {!process.env.NEXT_PUBLIC_API_URL && (
          <p className="text-sm text-yellow-600 mt-2">
            Running in mock mode (NEXT_PUBLIC_API_URL not configured)
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Panel - Inputs */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl font-bold mb-4">1. Select Task</h2>
            <TaskSelector
              selectedTask={selectedTask}
              onSelectTask={setSelectedTask}
              disabled={isProcessing}
            />
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4">2. Choose Style</h2>
            <StyleSelector
              selectedStyle={selectedStyle}
              onSelectStyle={setSelectedStyle}
              disabled={isProcessing}
            />
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4">3. Add Prompt (Optional)</h2>
            <Input
              name="prompt"
              type="text"
              placeholder="e.g., Create a vibrant thumbnail for car sale promo..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isProcessing}
            />
            <p className="text-xs text-slate-500 mt-2">
              Leave empty for default prompt based on task and style
            </p>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4">4. Upload Image (Optional)</h2>
            <ImageUploader
              uploadedImage={uploadedImage}
              onUpload={setUploadedImage}
              disabled={isProcessing}
            />
          </Card>

          <div className="flex gap-3">
            <GenerateButton
              disabled={!selectedTask || !selectedStyle || isProcessing}
              isGenerating={isProcessing}
              onClick={handleGenerate}
            />
            {(isComplete || hasError) && (
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-lg font-medium transition-colors bg-slate-200 text-slate-700 hover:bg-slate-300"
              >
                Reset All
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Output */}
        <div>
          <Card className="sticky top-4">
            <h2 className="text-2xl font-bold mb-4">Output</h2>
            
            {state === "idle" && (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-4">🎨</div>
                <p>Select task and style, then click Generate to see results.</p>
              </div>
            )}

            {isProcessing && (
              <WorkerAnimation currentStep={currentWorker} />
            )}

            {isComplete && result && (
              <OutputDisplay
                output={result}
                onGenerateAnother={handleGenerateAnother}
              />
            )}

            {hasError && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4 text-red-500">⚠️</div>
                <p className="text-red-600 font-medium mb-4">Generation Failed</p>
                <p className="text-sm text-slate-600 mb-6">{error}</p>
                <button
                  onClick={handleGenerateAnother}
                  className="px-6 py-3 rounded-lg font-medium bg-primary text-white hover:bg-primary/90"
                >
                  Try Again
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
