import Button from "../shared/Button";

interface GenerateButtonProps {
  disabled: boolean;
  isGenerating: boolean;
  onClick: () => void;
}

export default function GenerateButton({ disabled, isGenerating, onClick }: GenerateButtonProps) {
  return (
    <Button
      variant="primary"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-lg py-4"
    >
      {isGenerating ? "Generating..." : "Generate Creative"}
    </Button>
  );
}
