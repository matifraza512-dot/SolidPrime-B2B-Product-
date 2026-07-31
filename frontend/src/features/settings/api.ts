import { apiClient } from "@/api/client";
import type { Organization, User } from "@/types";

export interface NotificationPreferences {
  notify_deal_won_lost: boolean;
  notify_task_assigned: boolean;
  notify_customer_created: boolean;
  email_weekly_digest: boolean;
}

export type ProfilePayload = Partial<Pick<User, "first_name" | "last_name" | "phone" | "job_title">>;

export async function updateProfile(payload: ProfilePayload): Promise<User> {
  const { data } = await apiClient.patch("/auth/me/", payload);
  return data;
}

export async function changePassword(payload: {
  old_password: string;
  new_password: string;
}): Promise<{ detail: string }> {
  const { data } = await apiClient.post("/auth/change-password/", payload);
  return data;
}

export async function fetchOrganization(): Promise<Organization> {
  const { data } = await apiClient.get("/organizations/current/");
  return data;
}

export async function updateOrganization(payload: { name: string }): Promise<Organization> {
  const { data } = await apiClient.patch("/organizations/current/", payload);
  return data;
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await apiClient.get("/notification-preferences/");
  return data;
}

export async function updateNotificationPreferences(
  payload: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const { data } = await apiClient.patch("/notification-preferences/", payload);
  return data;
}
