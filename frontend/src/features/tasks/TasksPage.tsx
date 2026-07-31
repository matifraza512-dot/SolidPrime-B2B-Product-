import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { fetchTasks, updateTask, deleteTask } from "./api";
import type { Task, TaskStatus } from "./api";
import { TaskCard } from "./TaskCard";
import { TaskFormModal } from "./TaskFormModal";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

const columns: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];

export function TasksPage() {
  const queryClient = useQueryClient();
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>("todo");

  const { data: tasks, isLoading } = useQuery({ queryKey: ["tasks"], queryFn: fetchTasks });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => updateTask(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueryData<Task[]>(["tasks"]);
      queryClient.setQueryData<Task[]>(["tasks"], (old) =>
        old?.map((t) => (t.public_id === id ? { ...t, status } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["tasks"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success("Task deleted");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData("taskId", taskId);
  }

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    setDragOverStatus(null);
    if (taskId) moveMutation.mutate({ id: taskId, status });
  }

  function handleDelete(task: Task) {
    if (confirm(`Delete "${task.title}"?`)) {
      deleteMutation.mutate(task.public_id);
    }
  }

  function openCreate(status: TaskStatus) {
    setEditingTask(undefined);
    setCreateDefaultStatus(status);
    setShowFormModal(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setShowFormModal(true);
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Tasks</h1>
          <p className="text-sm text-muted">Drag a task card between columns to update its status.</p>
        </div>
        <Button onClick={() => openCreate("todo")}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {!tasks?.length ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create your first task to start tracking work."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(({ status, label }) => {
            const statusTasks = tasks.filter((t) => t.status === status);

            return (
              <div
                key={status}
                onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={(e) => handleDrop(e, status)}
                className={`flex flex-col rounded-xl border p-3 transition-colors min-h-[160px] ${
                  dragOverStatus === status ? "border-accent bg-accent/5" : "border-border bg-surface"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-primary">{label}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{statusTasks.length}</span>
                    <button
                      onClick={() => openCreate(status)}
                      className="rounded p-0.5 text-muted hover:bg-surface-hover hover:text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {statusTasks.map((task) => (
                    <TaskCard
                      key={task.public_id}
                      task={task}
                      onDragStart={handleDragStart}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showFormModal && (
        <TaskFormModal task={editingTask} defaultStatus={createDefaultStatus} onClose={() => setShowFormModal(false)} />
      )}
    </div>
  );
}
