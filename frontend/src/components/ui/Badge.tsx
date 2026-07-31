import type { ReactNode } from "react";
import { clsx } from "clsx";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-white/5 text-secondary border-border-strong",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  danger: "bg-danger-soft text-danger border-danger/20",
  info: "bg-info-soft text-info border-info/20",
  accent: "bg-accent-soft text-accent-hover border-accent/20",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        toneStyles[tone]
      )}
    >
      {children}
    </span>
  );
}
