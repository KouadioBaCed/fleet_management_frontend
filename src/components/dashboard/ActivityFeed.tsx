import { useState, useEffect } from 'react';
import {
  Activity as ActivityIcon,
  MapPin,
  AlertTriangle,
  Car,
  Users,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Plus,
  Wrench,
  RefreshCw, 
  Filter,
} from 'lucide-react';
import { dashboardApi, type Activity } from '@/api/dashboard';

const ACTIVITY_ICONS: Record<string, typeof ActivityIcon> = {
  mission_created: Plus,
  mission_started: Play,
  mission_completed: CheckCircle,
  mission_cancelled: XCircle,
  incident_reported: AlertTriangle,
  incident_resolved: CheckCircle,
  vehicle_status_changed: Car,
  vehicle_created: Plus,
  vehicle_maintenance: Wrench,
  driver_status_changed: Users,
  driver_created: Plus,
  trip_started: Play,
  trip_paused: Pause,
  trip_resumed: Play,
  trip_completed: CheckCircle,
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  info: { bg: '#E8EFED', text: '#6A8A82', border: '#6A8A82' },
  success: { bg: '#D1FAE5', text: '#059669', border: '#059669' },
  warning: { bg: '#FEF3C7', text: '#D97706', border: '#D97706' },
  error: { bg: '#FEE2E2', text: '#DC2626', border: '#DC2626' },
};

interface ActivityFeedProps {
  limit?: number;
  showFilters?: boolean;
  onViewAll?: () => void;
}

export default function ActivityFeed({ limit = 10, showFilters = false, onViewAll }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const filters: { limit: number; type?: string } = { limit };
      if (filter !== 'all') {
        // Group filters
        if (filter === 'missions') {
          filters.type = 'mission_started';
        } else if (filter === 'incidents') {
          filters.type = 'incident_reported';
        }
      }
      const data = await dashboardApi.getActivities(filters) as any;
      // Handle different response formats
      let activityList: Activity[] = [];
      if (Array.isArray(data)) {
        activityList = data;
      } else if (data && Array.isArray(data.results)) {
        activityList = data.results;
      }
      // Apply limit client-side as a safety measure
      setActivities(activityList.slice(0, limit));
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [filter, limit]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'A l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  const getActivityIcon = (type: string) => {
    return ACTIVITY_ICONS[type] || ActivityIcon;
  };

  const filterButtons = [
    { key: 'all', label: 'Tout' },
    { key: 'missions', label: 'Missions' },
    { key: 'incidents', label: 'Incidents' },
  ];

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6" style={{ borderColor: '#E8ECEC' }}>
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h2 className="text-base sm:text-lg font-bold" style={{ color: '#191919' }}>Activité récente</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:shadow-md transition-all cursor-pointer"
            style={{ color: '#6A8A82', backgroundColor: '#E8EFED' }}
          >
            Voir tout
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                filter === btn.key
                  ? 'text-white'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={filter === btn.key ? { backgroundColor: '#6A8A82' } : {}}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-2 sm:space-y-3">
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-gray-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <ActivityIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
            <p className="text-sm">Aucune activité récente</p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.activity_type);
            const style = SEVERITY_STYLES[activity.severity] || SEVERITY_STYLES.info;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all hover:shadow-md"
                style={{ backgroundColor: '#F0F3F2' }}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: style.bg }}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: style.text }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm truncate" style={{ color: '#191919' }}>
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-1 hidden sm:block">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {activity.severity_display}
                    </span>
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-500">
                    {activity.driver_name && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="truncate max-w-[60px] sm:max-w-none">{activity.driver_name}</span>
                      </span>
                    )}
                    {activity.vehicle_plate && (
                      <span className="flex items-center gap-1 hidden xs:flex">
                        <Car className="w-3 h-3" />
                        {activity.vehicle_plate}
                      </span>
                    )}
                    {activity.mission_code && (
                      <span className="flex items-center gap-1 hidden sm:flex">
                        <MapPin className="w-3 h-3" />
                        {activity.mission_code}
                      </span>
                    )}
                    <span className="ml-auto flex-shrink-0" style={{ color: '#B87333' }}>
                      {formatTimeAgo(activity.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
