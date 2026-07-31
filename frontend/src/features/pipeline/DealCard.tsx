import { GripVertical } from "lucide-react";
import type { Deal } from "./api";

interface DealCardProps {
  deal: Deal;
  onDragStart: (e: React.DragEvent, dealId: string) => void;
}

export function DealCard({ deal, onDragStart }: DealCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.public_id)}
      className="cursor-grab active:cursor-grabbing rounded-lg border border-border bg-surface-raised p-3 shadow-sm hover:border-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-primary line-clamp-2">{deal.title}</p>
        <GripVertical className="h-4 w-4 shrink-0 text-muted" />
      </div>
      {deal.customer_name && (
        <p className="mt-1 text-xs text-muted">{deal.customer_name}</p>
      )}
      <p className="mt-2 font-tabular text-sm font-semibold text-accent">
        ${Number(deal.value).toLocaleString()}
      </p>
      {deal.owner_name && (
        <p className="mt-1 text-xs text-muted">{deal.owner_name}</p>
      )}
    </div>
  );
}
