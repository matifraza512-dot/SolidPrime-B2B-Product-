import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, Ban } from "lucide-react";
import { toast } from "sonner";
import { fetchAPIKeys, revokeAPIKey } from "./api";
import { CreateKeyModal } from "./CreateKeyModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDistanceToNow, format } from "date-fns";

export function IntegrationsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: keys, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: fetchAPIKeys,
  });

  const revokeMutation = useMutation({
    mutationFn: revokeAPIKey,
    onSuccess: () => {
      toast.success("API key revoked");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    onSettled: () => setRevokingId(null),
  });

  function handleRevoke(publicId: string) {
    setRevokingId(publicId);
    revokeMutation.mutate(publicId);
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Integrations</h1>
          <p className="text-sm text-muted">
            Generate API keys to let external tools connect to your BizOps data.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          New API Key
        </Button>
      </div>

      <Card className="overflow-hidden">
        {!keys?.length ? (
          <EmptyState
            icon={KeyRound}
            title="No API keys yet"
            description="Create a key to let scripts, CI pipelines, or other tools call the BizOps API."
          />
        ) : (
          <ul className="divide-y divide-border">
            {keys.map((key) => (
              <li key={key.public_id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-primary">{key.name}</span>
                    <Badge tone={key.is_active ? "success" : "danger"}>
                      {key.is_active ? "Active" : "Revoked"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 font-tabular text-xs text-muted">
                    {key.prefix}••••••••••••••••••••
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Created {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                    {key.created_by_name && ` by ${key.created_by_name}`}
                    {key.last_used_at && (
                      <> · Last used {format(new Date(key.last_used_at), "PP")}</>
                    )}
                  </p>
                </div>

                {key.is_active && (
                  <Button
                    variant="ghost"
                    onClick={() => handleRevoke(key.public_id)}
                    disabled={revokingId === key.public_id}
                    className="shrink-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Ban className="h-4 w-4" />
                    {revokingId === key.public_id ? "Revoking..." : "Revoke"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {showCreateModal && <CreateKeyModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
