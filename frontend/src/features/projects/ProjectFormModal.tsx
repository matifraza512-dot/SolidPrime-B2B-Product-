import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createProject, updateProject, fetchCustomerOptions } from "./api";
import type { Project, ProjectStatus } from "./api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { extractErrorMessage } from "@/api/client";

interface ProjectFormModalProps {
  project?: Project;
  onClose: () => void;
}

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function ProjectFormModal({ project, onClose }: ProjectFormModalProps) {
  const isEdit = Boolean(project);
  const queryClient = useQueryClient();

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [customer, setCustomer] = useState(project?.customer ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "planning");
  const [budget, setBudget] = useState(project?.budget ?? "");
  const [dueDate, setDueDate] = useState(project?.due_date ?? "");

  const { data: customers } = useQuery({
    queryKey: ["customer-options"],
    queryFn: fetchCustomerOptions,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        description,
        customer: customer || null,
        status,
        budget: budget || 0,
        due_date: dueDate || null,
      };
      return isEdit ? updateProject(project!.public_id, payload) : createProject(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Project updated" : "Project created");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      onClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary">
            {isEdit ? "Edit Project" : "New Project"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Customer</label>
              <Select value={customer} onChange={(e) => setCustomer(e.target.value)}>
                <option value="">None</option>
                {customers?.map((c) => (
                  <option key={c.public_id} value={c.public_id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted">Status</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Budget ($)</label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted">Due date</label>
              <Input
                type="date"
                value={dueDate ?? ""}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !name.trim()}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
