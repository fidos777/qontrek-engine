import { CREATIVE_STYLES } from "@/lib/constants";

interface StyleSelectorProps {
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
  disabled?: boolean;
}

export default function StyleSelector({ selectedStyle, onSelectStyle, disabled }: StyleSelectorProps) {
  return (
    <div className="space-y-3">
      {CREATIVE_STYLES.map((style) => (
        <button
          key={style.id}
          onClick={() => onSelectStyle(style.id)}
          disabled={disabled}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedStyle === style.id
              ? "border-primary bg-primary/5"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="font-medium mb-1">{style.label}</div>
          <div className="text-sm text-slate-600">{style.description}</div>
        </button>
      ))}
    </div>
  );
}
