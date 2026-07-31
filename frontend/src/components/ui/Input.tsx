import { type InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "h-10 rounded-lg border bg-surface px-3 text-sm text-primary placeholder:text-muted",
            "transition-colors duration-150 outline-none",
            "focus:border-accent focus:ring-1 focus:ring-accent",
            error ? "border-danger" : "border-border-strong hover:border-border-strong",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
