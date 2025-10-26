// components/ui/button.tsx
// Button component with variants

import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variantStyles = {
      default: "bg-gray-900 text-white hover:bg-gray-800",
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
      outline: "border border-gray-300 bg-white hover:bg-gray-50",
      ghost: "hover:bg-gray-100",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
    };

    const sizeStyles = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
