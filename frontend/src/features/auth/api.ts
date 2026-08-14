import { apiClient } from "@/api/client";
import type { User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  organization_name: string;
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post("/auth/login/", payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post("/auth/register/", payload);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get("/auth/me/");
  return data;
}
