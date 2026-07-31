import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { fetchCustomers, deleteCustomer } from "./api";
import { useDebounce } from "@/hooks/useDebounce";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { CustomerFormModal } from "./CustomerFormModal";
import { extractErrorMessage } from "@/api/client";
import type { Customer, CustomerStatus } from "@/types";

const statusTone: Record<CustomerStatus, "success" | "accent" | "danger"> = {
  active: "success",
  lead: "accent",
  churned: "danger",
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function CustomersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const debouncedSearch = useDebounce(search);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["customers", { page, search: debouncedSearch, status }],
    queryFn: () => fetchCustomers({ page, search: debouncedSearch || undefined, status: status || undefined }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success("Customer deleted");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Customers</h1>
          <p className="text-sm text-muted">Manage your customer relationships and accounts.</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> New customer
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search customers..." />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40">
          <option value="">All statuses</option>
          <option value="lead">Lead</option>
          <option value="active">Active</option>
          <option value="churned">Churned</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <PageSpinner />
        ) : !data?.results.length ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add your first customer to start tracking relationships and revenue."
            action={
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" /> New customer
              </Button>
            }
          />
        ) : (
          <>
            <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Industry</th>
                    <th className="px-4 py-3 font-medium text-right">Lifetime value</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((c) => (
                    <tr key={c.public_id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        <p className="font-medium text-primary">{c.name}</p>
                        <p className="text-xs text-muted">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-secondary">{c.company || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-secondary">{c.industry || "—"}</td>
                      <td className="px-4 py-3 text-right font-tabular text-primary">
                        {currency.format(Number(c.lifetime_value))}
                      </td>
                      <td className="px-4 py-3 text-secondary">{c.owner_name || "Unassigned"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => { setEditing(c); setFormOpen(true); }}
                            aria-label={`Edit ${c.name}`}
                            className="rounded-md p-1.5 text-muted hover:bg-surface-raised hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            aria-label={`Delete ${c.name}`}
                            className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={data.current_page}
              totalPages={data.total_pages}
              totalCount={data.count}
              pageSize={data.page_size}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <CustomerFormModal open={formOpen} onClose={() => setFormOpen(false)} customer={editing} />

      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.name}
          isLoading={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.public_id)}
        />
      )}
    </div>
  );
}

function ConfirmDeleteModal({
  name,
  onCancel,
  onConfirm,
  isLoading,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl border border-border-strong bg-surface-raised p-5 shadow-2xl">
        <h2 className="text-sm font-semibold text-primary">Delete {name}?</h2>
        <p className="mt-1.5 text-sm text-muted">
          This permanently removes the customer record. This action can't be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" isLoading={isLoading} onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
