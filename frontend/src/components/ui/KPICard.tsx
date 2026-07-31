import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "./Card";

export function KPICard({
  icon: Icon,
  label,
  value,
  delta,
  suffix,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: number;
  suffix?: string;
}) {
  const isPositive = (delta ?? 0) >= 0;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft">
          <Icon className="h-3.5 w-3.5 text-accent-hover" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-tabular text-2xl font-semibold text-primary">{value}</p>
        {suffix && <span className="text-xs text-muted">{suffix}</span>}
      </div>
      {delta !== undefined && (
        <div className={`mt-2 flex items-center gap-1 text-xs ${isPositive ? "text-success" : "text-danger"}`}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span className="font-tabular">{Math.abs(delta)}%</span>
          <span className="text-muted">vs last month</span>
        </div>
      )}
    </Card>
  );
}
