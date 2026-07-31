import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised border border-border">
        <Icon className="h-5 w-5 text-muted" />
      </div>
      <div>
        <p className="text-sm font-medium text-primary">{title}</p>
        <p className="mt-1 text-sm text-muted max-w-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}
