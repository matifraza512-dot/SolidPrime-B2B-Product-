import { apiClient } from "@/api/client";

export type DealStage = "lead" | "contacted" | "proposal" | "won" | "lost";

export interface Deal {
  public_id: string;
  title: string;
  customer: string | null;
  customer_name: string | null;
  value: string;
  stage: DealStage;
  stage_display: string;
  owner: string | null;
  owner_name: string | null;
  expected_close_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DealPayload {
  title: string;
  customer?: string | null;
  value?: number | string;
  stage?: DealStage;
  owner?: string | null;
  expected_close_date?: string | null;
  notes?: string;
}

export async function fetchDeals(): Promise<Deal[]> {
  const { data } = await apiClient.get("/deals/");
  return data;
}

export async function createDeal(payload: DealPayload): Promise<Deal> {
  const { data } = await apiClient.post("/deals/", payload);
  return data;
}

export async function updateDealStage(publicId: string, stage: DealStage): Promise<Deal> {
  const { data } = await apiClient.patch(`/deals/${publicId}/`, { stage });
  return data;
}

export async function deleteDeal(publicId: string): Promise<void> {
  await apiClient.delete(`/deals/${publicId}/`);
}
