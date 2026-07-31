import { apiClient } from "@/api/client";
import type { PaginatedResponse } from "@/types";

export type AuditAction = "create" | "update" | "delete" | "login";

export interface AuditLogEntry {
  public_id: string;
  actor_name: string;
  actor_email_snapshot: string;
  action: AuditAction;
  resource_type: string;
  resource_id: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogParams {
  page?: number;
  search?: string;
  action?: string;
  resource_type?: string;
}

export async function fetchAuditLogs(params: AuditLogParams): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await apiClient.get("/audit-logs/", { params });
  return data;
}
