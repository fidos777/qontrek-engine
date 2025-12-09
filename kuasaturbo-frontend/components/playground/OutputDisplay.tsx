"use client";

import { useState } from "react";
import type { GenerateCreativeResponse } from "@/lib/types";
import Badge from "../shared/Badge";
import Button from "../shared/Button";

interface OutputDisplayProps {
  output: GenerateCreativeResponse;
  onGenerateAnother: () => void;
}

export default function OutputDisplay({ output, onGenerateAnother }: OutputDisplayProps) {
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="space-y-6">
      {/* Mock Mode Badge */}
      {output.mock_mode && (
        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
          Mock Mode (No API configured)
        </Badge>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-slate-500">Task</div>
          <div className="font-medium">{output.task}</div>
        </div>
        <div>
          <div className="text-slate-500">Style</div>
          <div className="font-medium">{output.style_used}</div>
        </div>
        <div>
          <div className="text-slate-500">Model</div>
          <div className="font-medium">{output.model_used}</div>
        </div>
        <div>
          <div className="text-slate-500">Credits</div>
          <div className="font-medium">{output.credits_charged}</div>
        </div>
      </div>

      {/* Copy Output */}
      {output.outputs.copy && (
        <div>
          <h3 className="font-bold mb-2">Generated Copy</h3>
          <p className="text-slate-700 leading-relaxed">{output.outputs.copy}</p>
        </div>
      )}

      {/* Composition Notes */}
      {output.outputs.metadata?.composition_notes && (
        <div>
          <h3 className="font-bold mb-2">Composition Notes</h3>
          <ul className="space-y-2">
            {output.outputs.metadata.composition_notes.map((note: string, index: number) => (
              <li key={index} className="text-slate-700 flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Metadata */}
      {output.outputs.metadata && (
        <div>
          <h3 className="font-bold mb-2">Specifications</h3>
          <div className="space-y-1 text-sm">
            {output.outputs.metadata.aspect_ratio && (
              <div className="flex justify-between">
                <span className="text-slate-500">Aspect Ratio:</span>
                <span className="font-medium">{output.outputs.metadata.aspect_ratio}</span>
              </div>
            )}
            {output.outputs.metadata.recommended_dimensions && (
              <div className="flex justify-between">
                <span className="text-slate-500">Dimensions:</span>
                <span className="font-medium">{output.outputs.metadata.recommended_dimensions}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Images (if any) */}
      {output.outputs.images && output.outputs.images.length > 0 && (
        <div>
          <h3 className="font-bold mb-2">Generated Images</h3>
          <div className="grid grid-cols-2 gap-3">
            {output.outputs.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Generated ${index + 1}`}
                className="rounded-lg border-2 border-slate-200"
              />
            ))}
          </div>
        </div>
      )}

      {/* JSON Toggle */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={() => setShowJson(!showJson)}
          className="text-sm text-primary hover:underline"
        >
          {showJson ? "Hide" : "Show"} JSON Response
        </button>
        {showJson && (
          <pre className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(output, null, 2)}
          </pre>
        )}
      </div>

      {/* Generate Another Button */}
      <Button
        variant="primary"
        onClick={onGenerateAnother}
        className="w-full"
      >
        Generate Another
      </Button>
    </div>
  );
}
