import { apiClient } from './client';

export interface VehicleStats {
  total: number;
  available: number;
  in_use: number;
  maintenance: number;
  out_of_service: number;
}

export interface DriverStats {
  total: number;
  available: number;
  on_mission: number;
  on_break: number;
  off_duty: number;
  active: number;
}

export interface MissionStats {
  total: number;
  pending: number;
  assigned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  today: number;
  this_week: number;
}

export interface AlertStats {
  total_unresolved: number;
  minor: number;
  moderate: number;
  major: number;
  critical: number;
}

export interface RecentAlert {
  id: number;
  type: string;
  type_display: string;
  severity: string;
  severity_display: string;
  title: string;
  vehicle: string | null;
  driver: string | null;
  reported_at: string;
  is_resolved: boolean;
}

export interface RecentActivity {
  id: number;
  type: string;
  title: string;
  vehicle: string | null;
  driver: string | null;
  timestamp: string | null;
}

export interface TopDriver {
  id: number;
  name: string;
  initials: string;
  trips: number;
  rating: number;
}

export interface DashboardStats {
  vehicles: VehicleStats;
  drivers: DriverStats;
  missions: MissionStats;
  alerts: AlertStats;
  recent_alerts: RecentAlert[];
  recent_activity: RecentActivity[];
  top_drivers: TopDriver[];
}

export interface Activity {
  id: number;
  activity_type: string;
  activity_type_display: string;
  severity: 'info' | 'warning' | 'success' | 'error';
  severity_display: string;
  title: string;
  description: string;
  vehicle_plate: string | null;
  driver_name: string | null;
  mission_code: string | null;
  user_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ActivityFilters {
  type?: string;
  severity?: string;
  limit?: number;
  since?: string;
}

export interface TopPerformer {
  rank: number;
  driver_id: number;
  name: string;
  initials: string;
  rating: number;
  performance_score: number;
  total_trips: number;
  completion_rate: number;
  punctuality_rate: number;
  distance_period: number;
  status: string;
}

export interface DriverRanking {
  rank: number;
  driver_id: number;
  name: string;
  employee_id: string;
  status: string;
  rating: number;
  total_trips: number;
  total_distance: number;
  total_missions: number;
  completed_missions: number;
  missions_period: number;
  completed_missions_period: number;
  distance_period: number;
  hours_driven_period: number;
  incidents_period: number;
  completion_rate: number;
  completion_rate_period: number;
  punctuality_rate: number;
  incident_rate: number;
  incident_rate_period: number;
  avg_speed: number;
  fuel_efficiency: number;
  performance_score: number;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/analytics/dashboard/');
    return response.data;
  },

  getActivities: async (filters?: ActivityFilters): Promise<Activity[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.since) params.append('since', filters.since);

    const response = await apiClient.get<Activity[]>(`/analytics/activities/?${params.toString()}`);
    return response.data;
  },

  getActivityTypes: async (): Promise<{
    types: { value: string; label: string }[];
    severities: { value: string; label: string }[];
  }> => {
    const response = await apiClient.get('/analytics/activities/types/');
    return response.data;
  },

  getTopPerformers: async (limit: number = 5): Promise<{ top_performers: TopPerformer[] }> => {
    const response = await apiClient.get(`/analytics/drivers/top/?limit=${limit}`);
    return response.data;
  },

  getDriverRankings: async (limit: number = 10, period: number = 30): Promise<{
    period_days: number;
    total_drivers: number;
    rankings: DriverRanking[];
  }> => {
    const response = await apiClient.get(`/analytics/drivers/ranking/?limit=${limit}&period=${period}`);
    return response.data;
  },

  getDriverPerformance: async (driverId: number, period: number = 30): Promise<{
    period_days: number;
    metrics: DriverRanking;
  }> => {
    const response = await apiClient.get(`/analytics/drivers/${driverId}/performance/?period=${period}`);
    return response.data;
  },
};
