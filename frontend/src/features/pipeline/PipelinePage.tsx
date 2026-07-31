import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kanban, Plus } from "lucide-react";
import { fetchDeals, updateDealStage } from "./api";
import type { Deal, DealStage } from "./api";
import { DealCard } from "./DealCard";
import { AddDealModal } from "./AddDealModal";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

const columns: { stage: DealStage; label: string }[] = [
  { stage: "lead", label: "Lead" },
  { stage: "contacted", label: "Contacted" },
  { stage: "proposal", label: "Proposal" },
  { stage: "won", label: "Won" },
  { stage: "lost", label: "Lost" },
];

export function PipelinePage() {
  const queryClient = useQueryClient();
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: deals, isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: fetchDeals,
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) => updateDealStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ["deals"] });
      const previous = queryClient.getQueryData<Deal[]>(["deals"]);
      queryClient.setQueryData<Deal[]>(["deals"], (old) =>
        old?.map((d) => (d.public_id === id ? { ...d, stage } : d))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["deals"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });

  function handleDragStart(e: React.DragEvent, dealId: string) {
    e.dataTransfer.setData("dealId", dealId);
  }

  function handleDrop(e: React.DragEvent, stage: DealStage) {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    setDragOverStage(null);
    if (dealId) moveMutation.mutate({ id: dealId, stage });
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Sales Pipeline</h1>
          <p className="text-sm text-muted">Drag a deal card between columns to update its stage.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Add Deal
        </Button>
      </div>

      {!deals?.length ? (
        <EmptyState
          icon={Kanban}
          title="No deals yet"
          description="Deals you create will show up here as cards you can drag between stages."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {columns.map(({ stage, label }) => {
            const stageDeals = deals.filter((d) => d.stage === stage);
            const total = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);

            return (
              <div
                key={stage}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, stage)}
                className={`flex flex-col rounded-xl border p-3 transition-colors min-h-[160px] ${
                  dragOverStage === stage ? "border-accent bg-accent/5" : "border-border bg-surface"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-primary">{label}</h2>
                  <span className="text-xs text-muted">{stageDeals.length}</span>
                </div>
                <p className="mb-3 font-tabular text-xs text-muted">${total.toLocaleString()}</p>
                <div className="flex flex-col gap-2">
                  {stageDeals.map((deal) => (
                    <DealCard key={deal.public_id} deal={deal} onDragStart={handleDragStart} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && <AddDealModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
