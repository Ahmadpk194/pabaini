import client from '../api/client';
import { NotificationsListResponse, AppNotification } from '../types/notification.types';

export async function getNotifications(params: {
  unread_only?: boolean;
  page?: number;
  limit?: number;
}): Promise<NotificationsListResponse> {
  const response = await client.get('/notifications', { params });
  return response.data.data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const response = await client.get('/notifications/unread-count');
  // Normalize the unread count in case backend returns raw number or wrapped object
  const data = response.data.data;
  const count = typeof data === 'number' ? data : data?.count ?? 0;
  return { count };
}

export async function markAsRead(id: number): Promise<AppNotification> {
  const response = await client.patch(`/notifications/${id}/read`);
  return response.data.data;
}

export async function markAllAsRead(): Promise<{ updated: number }> {
  const response = await client.patch('/notifications/read-all');
  return response.data.data;
}
