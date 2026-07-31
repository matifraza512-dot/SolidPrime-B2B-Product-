import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { Task, TaskPriority } from "./api";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const priorityTone: Record<TaskPriority, string> = {
  low: "text-muted",
  medium: "text-amber-400",
  high: "text-red-400",
};

export function TaskCard({ task, onDragStart, onEdit, onDelete }: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.public_id)}
      className="group cursor-grab active:cursor-grabbing rounded-lg border border-border bg-surface-raised p-3 shadow-sm hover:border-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-primary line-clamp-2">{task.title}</p>
        <GripVertical className="h-4 w-4 shrink-0 text-muted" />
      </div>

      {task.project_name && (
        <p className="mt-1 text-xs text-muted">{task.project_name}</p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className={`text-xs font-medium ${priorityTone[task.priority]}`}>
          {task.priority_display}
        </span>
        {task.due_date && (
          <span className="text-xs text-muted">{format(new Date(task.due_date), "MMM d")}</span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {task.assignee_name ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[10px] font-medium text-secondary">
            {task.assignee_name[0]?.toUpperCase()}
          </span>
        ) : (
          <span className="text-xs text-muted">Unassigned</span>
        )}

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-primary"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="rounded p-1 text-muted hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
