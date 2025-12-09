'use client';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onChange,
  children,
  disabled = false,
  className = '',
}: SelectProps) {
  const baseClasses = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FE4800] focus:border-transparent disabled:bg-slate-100';

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </select>
  );
}
export default Select;
