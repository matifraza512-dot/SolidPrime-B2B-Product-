import { useId } from "react";

interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className = "h-10 w-10" }: LogoMarkProps) {
  const id = useId();
  const gradA = `${id}-a`;
  const gradB = `${id}-b`;

  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradA} x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id={gradB} x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      {/* connecting lines */}
      <line x1="14" y1="17" x2="32" y2="11" stroke={`url(#${gradA})`} strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="14" y1="17" x2="24" y2="26" stroke={`url(#${gradA})`} strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="32" y1="11" x2="24" y2="26" stroke={`url(#${gradA})`} strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="24" y1="26" x2="15" y2="37" stroke={`url(#${gradA})`} strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="24" y1="26" x2="37" y2="24" stroke={`url(#${gradA})`} strokeWidth="1.25" strokeOpacity="0.5" strokeDasharray="2.5 2.5" />

      {/* nodes */}
      <circle cx="32" cy="11" r="4.5" fill={`url(#${gradB})`} />
      <circle cx="14" cy="17" r="3.25" fill="#dbeafe" />
      <circle cx="24" cy="26" r="4" fill={`url(#${gradB})`} />
      <circle cx="15" cy="37" r="3.25" fill={`url(#${gradA})`} />
      <circle cx="37" cy="24" r="2.25" fill="#eff6ff" />
    </svg>
  );
}
