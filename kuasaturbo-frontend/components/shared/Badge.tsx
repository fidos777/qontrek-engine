'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };

  const classes = `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClasses[variant]}`;

  return (
    <span className={classes}>
      {children}
    </span>
  );
}
export default Badge;
