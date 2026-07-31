import { apiClient } from "@/api/client";
import type { Customer, PaginatedResponse } from "@/types";

export interface CustomerListParams {
  page?: number;
  search?: string;
  status?: string;
  ordering?: string;
}

export async function fetchCustomers(params: CustomerListParams): Promise<PaginatedResponse<Customer>> {
  const { data } = await apiClient.get("/customers/", { params });
  return data;
}

export async function fetchCustomer(publicId: string): Promise<Customer> {
  const { data } = await apiClient.get(`/customers/${publicId}/`);
  return data;
}

export type CustomerPayload = Partial<
  Pick<Customer, "name" | "company" | "email" | "phone" | "status" | "industry" | "notes"> & {
    lifetime_value: string | number;
  }
>;

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const { data } = await apiClient.post("/customers/", payload);
  return data;
}

export async function updateCustomer(publicId: string, payload: CustomerPayload): Promise<Customer> {
  const { data } = await apiClient.patch(`/customers/${publicId}/`, payload);
  return data;
}

export async function deleteCustomer(publicId: string): Promise<void> {
  await apiClient.delete(`/customers/${publicId}/`);
}
