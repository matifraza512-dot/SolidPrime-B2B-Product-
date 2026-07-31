import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fetchProjects, deleteProject } from "./api";
import type { Project, ProjectStatus } from "./api";
import { ProjectFormModal } from "./ProjectFormModal";
import { useDebounce } from "@/hooks/useDebounce";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { format } from "date-fns";

const statusTone: Record<ProjectStatus, "success" | "info" | "danger" | "accent" | "warning"> = {
  planning: "info",
  active: "success",
  on_hold: "warning",
  completed: "accent",
  cancelled: "danger",
};

export function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const debouncedSearch = useDebounce(search);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["projects", { page, search: debouncedSearch, status }],
    queryFn: () =>
      fetchProjects({
        page,
        search: debouncedSearch || undefined,
        status: status || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });

  function handleDelete(project: Project) {
    if (confirm(`Delete "${project.name}"? This can't be undone.`)) {
      deleteMutation.mutate(project.public_id);
    }
  }

  function openCreate() {
    setEditingProject(undefined);
    setShowFormModal(true);
  }

  function openEdit(project: Project) {
    setEditingProject(project);
    setShowFormModal(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Projects</h1>
          <p className="text-sm text-muted">Track work across your customers and internal initiatives.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search projects..."
        />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40">
          <option value="">All statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <PageSpinner />
        ) : !data?.results.length ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start tracking work."
          />
        ) : (
          <>
            <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <ul className="divide-y divide-border">
                {data.results.map((project) => (
                  <li key={project.public_id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-primary">{project.name}</span>
                        <Badge tone={statusTone[project.status]}>{project.status_display}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {project.customer_name ?? "No customer"}
                        {project.owner_name && ` · ${project.owner_name}`}
                        {project.due_date && ` · Due ${format(new Date(project.due_date), "PP")}`}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-tabular text-sm text-secondary">
                        ${Number(project.budget).toLocaleString()}
                      </span>
                      <button
                        onClick={() => openEdit(project)}
                        className="rounded-md p-1.5 text-muted hover:bg-surface-hover hover:text-primary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        className="rounded-md p-1.5 text-muted hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <Pagination
              currentPage={page}
              totalPages={data.total_pages}
              totalCount={data.count}
              pageSize={data.page_size}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      {showFormModal && (
        <ProjectFormModal project={editingProject} onClose={() => setShowFormModal(false)} />
      )}
    </div>
  );
}
