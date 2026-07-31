import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createTask, updateTask, fetchProjectOptions, fetchTeamOptions } from "./api";
import type { Task, TaskPriority, TaskStatus } from "./api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { extractErrorMessage } from "@/api/client";

interface TaskFormModalProps {
  task?: Task;
  defaultStatus?: TaskStatus;
  onClose: () => void;
}

export function TaskFormModal({ task, defaultStatus, onClose }: TaskFormModalProps) {
  const isEdit = Boolean(task);
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [project, setProject] = useState(task?.project ?? "");
  const [assignee, setAssignee] = useState(task?.assignee ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");

  const { data: projects } = useQuery({ queryKey: ["project-options"], queryFn: fetchProjectOptions });
  const { data: team } = useQuery({ queryKey: ["team-options"], queryFn: fetchTeamOptions });

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title,
        description,
        project: project || null,
        assignee: assignee || null,
        status,
        priority,
        due_date: dueDate || null,
      };
      return isEdit ? updateTask(task!.public_id, payload) : createTask(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Task updated" : "Task created");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      onClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary">{isEdit ? "Edit Task" : "New Task"}</h2>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Write API docs" autoFocus />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Project</label>
              <Select value={project} onChange={(e) => setProject(e.target.value)}>
                <option value="">None</option>
                {projects?.map((p) => (
                  <option key={p.public_id} value={p.public_id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Assignee</label>
              <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {team?.map((m) => (
                  <option key={m.public_id} value={m.public_id}>{m.full_name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Status</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Priority</label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Due date</label>
              <Input type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {mutation.isError && <p className="text-xs text-red-400">Something went wrong. Try again.</p>}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending || !title.trim()}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
