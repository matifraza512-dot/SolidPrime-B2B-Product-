import { apiClient } from "@/api/client";

export interface SearchResultItem {
  public_id: string;
  label: string;
  sublabel: string;
}

export interface GlobalSearchResponse {
  customers: SearchResultItem[];
  deals: SearchResultItem[];
  team: SearchResultItem[];
}

export async function globalSearch(query: string): Promise<GlobalSearchResponse> {
  if (query.trim().length < 2) {
    return { customers: [], deals: [], team: [] };
  }
  const { data } = await apiClient.get("/search/", { params: { q: query } });
  return data;
}
