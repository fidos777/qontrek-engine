'use client';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Input({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
}: InputProps) {
  const baseClasses = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FE4800] focus:border-transparent disabled:bg-slate-100';

  return (
    <input
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseClasses} ${className}`}
    />
  );
}
export default Input;
