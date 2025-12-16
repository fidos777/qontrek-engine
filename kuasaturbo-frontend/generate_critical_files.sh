#!/bin/bash

BASE="/Users/firdausismail/Documents/qontrek-engine/kuasaturbo-frontend"

echo "🚀 Generating KuasaTurbo Frontend Critical Files..."
mkdir -p "$BASE/lib"
mkdir -p "$BASE/components/shared"

########################################
# lib/api.ts
########################################
cat > "$BASE/lib/api.ts" << 'FILE'
export interface GenerateCreativeParams {
  task: string;
  style: string;
  persona_id?: string;
  payload?: {
    prompt?: string;
    image_base64?: string;
  };
}

export interface GenerateCreativeResponse {
  status: 'success' | 'error';
  creative_id?: string;
  task?: string;
  style_used?: string;
  model_used?: string;
  credits_charged?: number;
  mock_mode?: boolean;
  outputs?: {
    images?: string[];
    copy?: string;
    metadata?: Record<string, any>;
  };
  error?: string;
}

export async function generateCreative(
  params: GenerateCreativeParams
): Promise<GenerateCreativeResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return getMockResponse(params);
  }

  try {
    const response = await fetch(`${apiUrl}/v1/engine/creative/generate`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: params.task,
        style: params.style,
        persona_id: params.persona_id || "default_creator",
        payload: params.payload || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn("API failed, using mock:", err);
    return getMockResponse(params);
  }
}

function getMockResponse(params: GenerateCreativeParams): GenerateCreativeResponse {
  return {
    status: "success",
    creative_id: `mock_${Date.now()}`,
    task: params.task,
    style_used: params.style,
    model_used: "mock-model",
    credits_charged: 0,
    mock_mode: true,
    outputs: {
      images: [],
      copy: `Mock output untuk task "${params.task}" dengan style "${params.style}". Backend belum connected.`,
      metadata: { generated_at: new Date().toISOString() },
    },
  };
}
FILE

########################################
# lib/constants.ts
########################################
cat > "$BASE/lib/constants.ts" << 'FILE'
export const CREATIVE_TASKS = [
  { id: 'thumbnail', label: 'Thumbnail' },
  { id: 'product_render', label: 'Product Render' },
  { id: 'story_infographic', label: 'Story Infographic' },
  { id: 'car_visualizer', label: 'Car Visualizer' },
  { id: 'image_cleanup', label: 'Image Cleanup' },
];

export const CREATIVE_STYLES = [
  { id: 'energetic', label: 'Energetic', description: 'Bold, high-energy visuals' },
  { id: 'premium', label: 'Premium', description: 'Luxury, sophisticated look' },
  { id: 'simple_clean', label: 'Simple & Clean', description: 'Minimalist, clear layout' },
  { id: 'modern', label: 'Modern', description: 'Contemporary, trendy feel' },
  { id: 'vibrant', label: 'Vibrant', description: 'Colorful and eye-catching' },
];
FILE

########################################
# components/shared/Button.tsx
########################################
cat > "$BASE/components/shared/Button.tsx" << 'FILE'
'use client';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}

export function Button({ children, onClick, disabled, type = "button", className = "" }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={\`
        px-4 py-2 rounded-lg font-medium transition-all
        \${disabled ? "bg-slate-300 cursor-not-allowed" : "bg-[#FE4800] text-white hover:bg-[#E04000]"}
        \${className}
      \`}
    >
      {children}
    </button>
  );
}
FILE

########################################
# components/shared/Card.tsx
########################################
cat > "$BASE/components/shared/Card.tsx" << 'FILE'
'use client';

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      {children}
    </div>
  );
}
FILE

########################################
# components/shared/Badge.tsx
########################################
cat > "$BASE/components/shared/Badge.tsx" << 'FILE'
'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variantClasses = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${variantClasses[variant]}\`}>
      {children}
    </span>
  );
}
FILE

########################################
# components/shared/Select.tsx
########################################
cat > "$BASE/components/shared/Select.tsx" << 'FILE'
'use client';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Select({ value, onChange, children, disabled }: SelectProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FE4800] focus:border-transparent disabled:bg-slate-100"
    >
      {children}
    </select>
  );
}
FILE

########################################
# components/shared/Input.tsx
########################################
cat > "$BASE/components/shared/Input.tsx" << 'FILE'
'use client';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Input({ value, onChange, placeholder, disabled }: InputProps) {
  return (
    <input
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FE4800] focus:border-transparent disabled:bg-slate-100"
    />
  );
}
FILE

echo "🎉 All critical files generated!"
