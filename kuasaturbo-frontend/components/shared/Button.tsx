'use client';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export function Button({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all';
  const stateClasses = disabled
    ? 'bg-slate-300 cursor-not-allowed'
    : 'bg-[#FE4800] text-white hover:bg-[#E04000]';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${stateClasses} ${className}`}
    >
      {children}
    </button>
  );
}
export default Button;
