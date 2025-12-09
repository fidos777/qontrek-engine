'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  const baseClasses = 'bg-white border border-slate-200 rounded-lg p-4 shadow-sm';

  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
}
export default Card;
