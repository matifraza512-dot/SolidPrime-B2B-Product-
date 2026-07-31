import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-accent hover:bg-accent-hover text-white shadow-sm shadow-accent/20",
  secondary: "bg-surface-raised hover:bg-surface-hover text-primary border border-border-strong",
  ghost: "hover:bg-surface-hover text-secondary hover:text-primary",
  danger: "bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
