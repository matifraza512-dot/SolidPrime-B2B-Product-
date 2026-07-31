import { apiClient } from "@/api/client";
import type { PaginatedResponse } from "@/types";

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";

export interface Project {
  public_id: string;
  name: string;
  description?: string;
  customer: string | null;
  customer_name: string | null;
  owner: string | null;
  owner_name: string | null;
  status: ProjectStatus;
  status_display: string;
  budget: string;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ProjectPayload {
  name: string;
  description?: string;
  customer?: string | null;
  status?: ProjectStatus;
  budget?: number | string;
  start_date?: string | null;
  due_date?: string | null;
}

export interface ProjectListParams {
  page?: number;
  search?: string;
  status?: string;
  ordering?: string;
}

export interface CustomerOption {
  public_id: string;
  name: string;
}

export async function fetchProjects(params: ProjectListParams): Promise<PaginatedResponse<Project>> {
  const { data } = await apiClient.get("/projects/", { params });
  return data;
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const { data } = await apiClient.post("/projects/", payload);
  return data;
}

export async function updateProject(publicId: string, payload: Partial<ProjectPayload>): Promise<Project> {
  const { data } = await apiClient.patch(`/projects/${publicId}/`, payload);
  return data;
}

export async function deleteProject(publicId: string): Promise<void> {
  await apiClient.delete(`/projects/${publicId}/`);
}

export async function fetchCustomerOptions(): Promise<CustomerOption[]> {
  const { data } = await apiClient.get("/customers/", { params: { page_size: 100 } });
  return (data.results ?? data).map((c: { public_id: string; name: string }) => ({
    public_id: c.public_id,
    name: c.name,
  }));
}
