import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, X, AlertTriangle, Wrench, Fuel, MapPin, Car, Users, FileText, Info } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { useTranslation } from '@/i18n';
import type { Notification, NotificationType } from '@/api/notifications';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'incident_reported':
    case 'incident_updated':
    case 'incident_resolved':
      return AlertTriangle;
    case 'maintenance_due':
    case 'maintenance_overdue':
    case 'maintenance_completed':
      return Wrench;
    case 'fuel_low':
    case 'fuel_anomaly':
      return Fuel;
    case 'mission_completed':
    case 'mission_delayed':
      return MapPin;
    case 'vehicle_insurance_expiring':
    case 'vehicle_inspection_due':
      return Car;
    case 'driver_license_expiring':
    case 'driver_document_expiring':
      return Users;
    case 'report_ready':
      return FileText;
    default:
      return Info;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'normal':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getNotificationColor = (type: NotificationType, priority: string) => {
  if (priority === 'urgent') return 'text-red-600';
  if (priority === 'high') return 'text-orange-600';

  switch (type) {
    case 'incident_reported':
    case 'incident_updated':
      return 'text-red-500';
    case 'incident_resolved':
      return 'text-green-500';
    case 'maintenance_due':
    case 'maintenance_overdue':
      return 'text-yellow-600';
    case 'maintenance_completed':
      return 'text-green-500';
    case 'fuel_low':
    case 'fuel_anomaly':
      return 'text-orange-500';
    case 'mission_completed':
      return 'text-green-500';
    case 'mission_delayed':
      return 'text-yellow-600';
    default:
      return 'text-blue-500';
  }
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'A l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (notification: Notification) => void;
}

function NotificationItem({ notification, onMarkRead, onDelete, onClick }: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.notification_type);
  const iconColor = getNotificationColor(notification.notification_type, notification.priority);
  const priorityClasses = getPriorityColor(notification.priority);

  return (
    <div
      className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.is_read ? 'bg-blue-50/50' : ''
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${notification.is_read ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityClasses}`}>
              {notification.priority_display}
            </span>
            <span className="text-xs text-gray-400">
              {formatTimeAgo(notification.created_at)}
            </span>
            {!notification.is_read && (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            )}
          </div>
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {notification.title}
          </h4>
          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
            {notification.message}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          {!notification.is_read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
              title="Marquer comme lu"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    notifications,
    unreadCount,
    urgentCount,
    highCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  // Charger les notifications au montage et toutes les 30 secondes
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lu
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Naviguer vers la page appropriee
    if (notification.incident_id) {
      navigate(`/incidents`);
    } else if (notification.maintenance_id) {
      navigate(`/maintenance`);
    } else if (notification.mission_id) {
      navigate(`/missions`);
    } else if (notification.vehicle_id) {
      navigate(`/vehicles`);
    } else if (notification.driver_id) {
      navigate(`/drivers`);
    }

    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton de notification */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1 ${
              urgentCount > 0 ? 'bg-red-500 animate-pulse' : highCount > 0 ? 'bg-orange-500' : 'bg-blue-500'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown des notifications */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-2 sm:inset-x-auto top-14 sm:top-auto sm:right-0 sm:mt-2 w-auto sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{t('notifications.title')}</h3>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {unreadCount} {t('notifications.unread')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                  title={t('notifications.markAllRead')}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm">{t('notifications.empty')}</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsOpen(false);
                }}
                className="text-sm text-center w-full py-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('notifications.settings')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
