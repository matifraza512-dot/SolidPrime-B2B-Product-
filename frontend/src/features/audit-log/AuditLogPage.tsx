import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, Plus, Pencil, Trash2, LogIn } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fetchAuditLogs } from "./api";
import { useDebounce } from "@/hooks/useDebounce";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AuditAction } from "./api";

const actionMeta: Record<AuditAction, { icon: typeof Plus; tone: "success" | "info" | "danger" | "accent"; label: string }> = {
  create: { icon: Plus, tone: "success", label: "Created" },
  update: { icon: Pencil, tone: "info", label: "Updated" },
  delete: { icon: Trash2, tone: "danger", label: "Deleted" },
  login: { icon: LogIn, tone: "accent", label: "Logged in" },
};

export function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["audit-logs", { page, search: debouncedSearch, action, resourceType }],
    queryFn: () =>
      fetchAuditLogs({
        page,
        search: debouncedSearch || undefined,
        action: action || undefined,
        resource_type: resourceType || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-primary">Audit Log</h1>
        <p className="text-sm text-muted">
          A complete, tamper-evident record of every action taken in your workspace.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search description or actor..." />
        <Select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="w-40">
          <option value="">All actions</option>
          <option value="create">Created</option>
          <option value="update">Updated</option>
          <option value="delete">Deleted</option>
          <option value="login">Logins</option>
        </Select>
        <Select value={resourceType} onChange={(e) => { setResourceType(e.target.value); setPage(1); }} className="w-40">
          <option value="">All resources</option>
          <option value="customer">Customers</option>
          <option value="session">Sessions</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <PageSpinner />
        ) : !data?.results.length ? (
          <EmptyState
            icon={ScrollText}
            title="No activity recorded yet"
            description="Actions like creating a customer or logging in will appear here automatically."
          />
        ) : (
          <>
            <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <ul className="divide-y divide-border">
                {data.results.map((entry) => {
                  const meta = actionMeta[entry.action];
                  const Icon = meta.icon;
                  return (
                    <li key={entry.public_id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-hover">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised">
                        <Icon className="h-3.5 w-3.5 text-secondary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-primary">{entry.actor_name}</span>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          {entry.resource_type && (
                            <span className="text-xs text-muted">on {entry.resource_type}</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-secondary">{entry.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted font-tabular" title={format(new Date(entry.created_at), "PPpp")}>
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
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
    </div>
  );
}
