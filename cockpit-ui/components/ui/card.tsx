// components/ui/card.tsx
// Trust Cockpit Card component with glass morphism

import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", style, ...props }, ref) => {
    const baseStyles: React.CSSProperties = {
      background: variant === 'glass' ? 'var(--bg-glass)' : 'var(--bg-card)',
      border: '1px solid var(--stroke)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--elev-1)',
      transition: `all var(--duration-normal) var(--ease-out)`,
      backdropFilter: variant === 'glass' ? 'blur(12px)' : undefined,
      ...style
    };

    return (
      <div
        ref={ref}
        className={className}
        style={baseStyles}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";
