export type Role = "admin" | "manager" | "employee";

export interface Organization {
  public_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface User {
  public_id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: Role;
  avatar: string | null;
  phone: string;
  job_title: string;
  organization: Organization;
  is_active_member: boolean;
  date_joined: string;
}

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  results: T[];
}

export interface ApiError {
  detail: string;
  errors: Record<string, string[]>;
}

export type CustomerStatus = "lead" | "active" | "churned";

export interface Customer {
  public_id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  status: CustomerStatus;
  industry: string;
  lifetime_value: string;
  notes?: string;
  logo?: string | null;
  owner: number | null;
  owner_name: string | null;
  created_at: string;
  updated_at?: string;
}
