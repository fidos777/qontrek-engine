// components/ui/card.tsx
// Simple Card component using Tailwind CSS

import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm ${className}`}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";
