import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { createDeal } from "./api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AddDealModalProps {
  onClose: () => void;
}

export function AddDealModal({ onClose }: AddDealModalProps) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createDeal({ title, value: value || 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary">New Deal</h2>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Acme Corp Expansion"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Value ($)</label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-400">Something went wrong. Try again.</p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !title.trim()}>
              {mutation.isPending ? "Creating..." : "Create Deal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
