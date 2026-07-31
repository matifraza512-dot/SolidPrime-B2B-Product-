import { apiClient } from "@/api/client";
import type { PaginatedResponse } from "@/types";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface LineItem {
  id?: number;
  description: string;
  quantity: string;
  unit_price: string;
  line_total?: string;
  position?: number;
}

export interface Invoice {
  public_id: string;
  invoice_number: string;
  customer: string;
  customer_name: string;
  project: string | null;
  project_name: string | null;
  status: InvoiceStatus;
  status_display: string;
  issue_date: string;
  due_date: string;
  notes: string;
  tax_rate: string;
  subtotal: string;
  tax_amount: string;
  total: string;
  line_items: LineItem[];
  created_at: string;
}

export interface InvoicePayload {
  customer: string;
  project?: string | null;
  status?: InvoiceStatus;
  issue_date: string;
  due_date: string;
  notes?: string;
  tax_rate?: string | number;
  line_items: { description: string; quantity: string | number; unit_price: string | number }[];
}

export interface InvoiceListParams {
  page?: number;
  search?: string;
  status?: string;
}

export interface CustomerOption {
  public_id: string;
  name: string;
}

export interface ProjectOption {
  public_id: string;
  name: string;
}

export async function fetchInvoices(params: InvoiceListParams): Promise<PaginatedResponse<Invoice>> {
  const { data } = await apiClient.get("/invoices/", { params });
  return data;
}

export async function fetchInvoice(publicId: string): Promise<Invoice> {
  const { data } = await apiClient.get(`/invoices/${publicId}/`);
  return data;
}

export async function createInvoice(payload: InvoicePayload): Promise<Invoice> {
  const { data } = await apiClient.post("/invoices/", payload);
  return data;
}

export async function updateInvoice(publicId: string, payload: Partial<InvoicePayload>): Promise<Invoice> {
  const { data } = await apiClient.patch(`/invoices/${publicId}/`, payload);
  return data;
}

export async function deleteInvoice(publicId: string): Promise<void> {
  await apiClient.delete(`/invoices/${publicId}/`);
}

export async function fetchCustomerOptions(): Promise<CustomerOption[]> {
  const { data } = await apiClient.get("/customers/", { params: { page_size: 100 } });
  return (data.results ?? data).map((c: { public_id: string; name: string }) => ({
    public_id: c.public_id,
    name: c.name,
  }));
}

export async function fetchProjectOptions(): Promise<ProjectOption[]> {
  const { data } = await apiClient.get("/projects/", { params: { page_size: 100 } });
  return (data.results ?? data).map((p: { public_id: string; name: string }) => ({
    public_id: p.public_id,
    name: p.name,
  }));
}
