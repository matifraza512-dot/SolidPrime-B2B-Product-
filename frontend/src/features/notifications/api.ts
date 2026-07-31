import { apiClient } from "@/api/client";

export interface NotificationItem {
  id: number;
  verb: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const { data } = await apiClient.get("/notifications/");
  return data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await apiClient.get("/notifications/unread_count/");
  return data.count;
}

export async function markRead(id: number): Promise<NotificationItem> {
  const { data } = await apiClient.post(`/notifications/${id}/mark_read/`);
  return data;
}

export async function markAllRead(): Promise<void> {
  await apiClient.post("/notifications/mark_all_read/");
}
