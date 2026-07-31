import { apiClient } from "@/api/client";

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  public_id: string;
  title: string;
  description: string;
  project: string | null;
  project_name: string | null;
  assignee: string | null;
  assignee_name: string | null;
  status: TaskStatus;
  status_display: string;
  priority: TaskPriority;
  priority_display: string;
  due_date: string | null;
  created_at: string;
}

export interface TaskPayload {
  title: string;
  description?: string;
  project?: string | null;
  assignee?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export interface ProjectOption {
  public_id: string;
  name: string;
}

export interface TeamOption {
  public_id: string;
  full_name: string;
}

export async function fetchTasks(): Promise<Task[]> {
  const { data } = await apiClient.get("/tasks/");
  return data;
}

export async function createTask(payload: TaskPayload): Promise<Task> {
  const { data } = await apiClient.post("/tasks/", payload);
  return data;
}

export async function updateTask(publicId: string, payload: Partial<TaskPayload>): Promise<Task> {
  const { data } = await apiClient.patch(`/tasks/${publicId}/`, payload);
  return data;
}

export async function deleteTask(publicId: string): Promise<void> {
  await apiClient.delete(`/tasks/${publicId}/`);
}

export async function fetchProjectOptions(): Promise<ProjectOption[]> {
  const { data } = await apiClient.get("/projects/", { params: { page_size: 100 } });
  return (data.results ?? data).map((p: { public_id: string; name: string }) => ({
    public_id: p.public_id,
    name: p.name,
  }));
}

export async function fetchTeamOptions(): Promise<TeamOption[]> {
  const { data } = await apiClient.get("/team/options/");
  return data;
}
