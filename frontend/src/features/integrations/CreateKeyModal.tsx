import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Copy, Check, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { createAPIKey } from "./api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CreateKeyModalProps {
  onClose: () => void;
}

export function CreateKeyModal({ onClose }: CreateKeyModalProps) {
  const [name, setName] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createAPIKey(name),
    onSuccess: (data) => {
      setRawKey(data.raw_key);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate();
  }

  async function handleCopy() {
    if (!rawKey) return;
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary">
            {rawKey ? "Key created" : "New API Key"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!rawKey ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Key name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CI Pipeline, Zapier"
                autoFocus
              />
            </div>

            {mutation.isError && (
              <p className="text-xs text-red-400">Something went wrong. Try again.</p>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || !name.trim()}>
                {mutation.isPending ? "Creating..." : "Create Key"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-xs text-amber-200">
                Copy this key now. For security, you won't be able to see it again.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas p-3">
              <code className="flex-1 overflow-x-auto whitespace-nowrap font-tabular text-xs text-primary">
                {rawKey}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-primary"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <Button onClick={onClose} className="mt-2 w-full">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
