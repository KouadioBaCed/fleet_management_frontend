import { apiClient } from './client';

export type NotificationType =
  | 'incident_reported'
  | 'incident_updated'
  | 'incident_resolved'
  | 'maintenance_due'
  | 'maintenance_overdue'
  | 'maintenance_completed'
  | 'fuel_low'
  | 'fuel_anomaly'
  | 'mission_completed'
  | 'mission_delayed'
  | 'driver_license_expiring'
  | 'driver_document_expiring'
  | 'vehicle_insurance_expiring'
  | 'vehicle_inspection_due'
  | 'alert'
  | 'reminder'
  | 'system'
  | 'report_ready';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: number;
  notification_type: NotificationType;
  notification_type_display: string;
  priority: NotificationPriority;
  priority_display: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  data?: Record<string, unknown>;
  incident_id?: number;
  vehicle_id?: number;
  driver_id?: number;
  maintenance_id?: number;
  mission_id?: number;
  vehicle_plate?: string;
  driver_name?: string;
  incident_title?: string;
  maintenance_type?: string;
  mission_code?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_priority?: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
}

export interface NotificationListResponse {
  results: Notification[];
  count: number;
  stats: NotificationStats;
}

export interface NotificationCountResponse {
  total: number;
  unread: number;
  urgent: number;
  high: number;
}

export const notificationsApi = {
  /**
   * Recuperer la liste des notifications
   */
  getNotifications: async (params?: {
    is_read?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
    limit?: number;
  }): Promise<NotificationListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.is_read !== undefined) {
      searchParams.append('is_read', params.is_read.toString());
    }
    if (params?.type) {
      searchParams.append('type', params.type);
    }
    if (params?.priority) {
      searchParams.append('priority', params.priority);
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    const query = searchParams.toString();
    const response = await apiClient.get<NotificationListResponse>(
      `/notifications/${query ? `?${query}` : ''}`
    );
    return response.data;
  },

  /**
   * Recuperer les notifications non lues
   */
  getUnreadNotifications: async (limit: number = 10): Promise<NotificationListResponse> => {
    const response = await apiClient.get<NotificationListResponse>(
      `/notifications/unread/?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Compter les notifications non lues
   */
  getNotificationCount: async (): Promise<NotificationCountResponse> => {
    const response = await apiClient.get<NotificationCountResponse>('/notifications/count/');
    return response.data;
  },

  /**
   * Recuperer une notification par ID
   */
  getNotification: async (id: number): Promise<Notification> => {
    const response = await apiClient.get<Notification>(`/notifications/${id}/`);
    return response.data;
  },

  /**
   * Marquer une notification comme lue
   */
  markAsRead: async (id: number): Promise<{ message: string; notification: Notification }> => {
    const response = await apiClient.post<{ message: string; notification: Notification }>(
      `/notifications/${id}/mark_read/`
    );
    return response.data;
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead: async (notificationIds?: number[]): Promise<{ message: string; count: number }> => {
    const response = await apiClient.post<{ message: string; count: number }>(
      '/notifications/mark_all_read/',
      { notification_ids: notificationIds }
    );
    return response.data;
  },

  /**
   * Supprimer les notifications lues
   */
  deleteReadNotifications: async (): Promise<{ message: string; count: number }> => {
    const response = await apiClient.delete<{ message: string; count: number }>(
      '/notifications/delete_read/'
    );
    return response.data;
  },

  /**
   * Supprimer une notification
   */
  deleteNotification: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}/`);
  },
};
