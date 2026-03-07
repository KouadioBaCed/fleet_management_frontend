import { create } from 'zustand';
import { notificationsApi, type Notification, type NotificationCountResponse } from '@/api/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  urgentCount: number;
  highCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  // Actions
  fetchNotifications: (limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteReadNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  urgentCount: 0,
  highCount: 0,
  isLoading: false,
  error: null,
  lastFetchTime: null,

  fetchNotifications: async (limit: number = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await notificationsApi.getNotifications({ limit });
      set({
        notifications: response.results,
        unreadCount: response.stats.unread,
        urgentCount: response.stats.by_priority?.urgent || 0,
        highCount: response.stats.by_priority?.high || 0,
        lastFetchTime: Date.now(),
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur lors du chargement des notifications';
      set({ error });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      // Utiliser l'endpoint existant avec limit=1 pour obtenir les stats
      const response = await notificationsApi.getNotifications({ limit: 1 });
      set({
        unreadCount: response.stats.unread,
        urgentCount: response.stats.by_priority?.urgent || 0,
        highCount: response.stats.by_priority?.high || 0,
      });
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  },

  markAsRead: async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur lors de la mise a jour';
      set({ error });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        })),
        unreadCount: 0,
        urgentCount: 0,
        highCount: 0,
      }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur lors de la mise a jour';
      set({ error });
    }
  },

  deleteNotification: async (id: number) => {
    try {
      await notificationsApi.deleteNotification(id);
      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        const wasUnread = notification && !notification.is_read;
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      set({ error });
    }
  },

  deleteReadNotifications: async () => {
    try {
      await notificationsApi.deleteReadNotifications();
      set((state) => ({
        notifications: state.notifications.filter((n) => !n.is_read),
      }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      set({ error });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      urgentCount: notification.priority === 'urgent' ? state.urgentCount + 1 : state.urgentCount,
      highCount: notification.priority === 'high' ? state.highCount + 1 : state.highCount,
    }));
  },

  clearError: () => set({ error: null }),
}));
