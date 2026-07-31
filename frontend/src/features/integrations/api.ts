import { apiClient } from "@/api/client";

export interface APIKey {
  public_id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  created_by_name: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface APIKeyCreated extends APIKey {
  raw_key: string;
}

export async function fetchAPIKeys(): Promise<APIKey[]> {
  const { data } = await apiClient.get("/api-keys/");
  return data;
}

export async function createAPIKey(name: string): Promise<APIKeyCreated> {
  const { data } = await apiClient.post("/api-keys/", { name });
  return data;
}

export async function revokeAPIKey(publicId: string): Promise<APIKey> {
  const { data } = await apiClient.post(`/api-keys/${publicId}/revoke/`);
  return data;
}
