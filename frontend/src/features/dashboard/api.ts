import { apiClient } from "@/api/client";

export interface KPISummary {
  revenue: { value: number; label: string };
  customers: { value: number; active: number; new_this_month: number };
  active_projects: { value: number; label: string; note?: string };
  api_requests: { value: number; label: string; note?: string };
  team_productivity: { value: number | null; label: string; note?: string };
  customers_by_status: { status: string; count: number }[];
}

export interface ActivityItem {
  public_id: string;
  actor_name: string;
  action: string;
  resource_type: string;
  description: string;
  created_at: string;
}

export async function fetchKPIs(): Promise<KPISummary> {
  const { data } = await apiClient.get("/dashboard/kpis/");
  return data;
}

export async function fetchActivity(): Promise<ActivityItem[]> {
  const { data } = await apiClient.get("/dashboard/activity/");
  return data;
}
