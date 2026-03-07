import { apiClient } from './client';
import type { Mission } from '@/types';

export interface MissionFilters {
  status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  search?: string;
  ordering?: string;
}

export interface MissionStats {
  total: number;
  by_status: {
    pending: number;
    assigned: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

export interface MissionListResponse {
  results: Mission[];
  stats: MissionStats;
  count: number;
}

export interface GPSPosition {
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number | null;
  accuracy: number;
  is_moving: boolean;
  battery_level?: number | null;
}

export interface DelayStatus {
  is_delayed: boolean;
  delay_type: 'start' | 'progress' | 'arrival' | null;
  delay_minutes: number;
  severity: 'none' | 'info' | 'warning' | 'critical';
}

export interface MissionAlert {
  id: number;
  type: string;
  type_display: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  delay_minutes?: number | null;
  created_at: string;
}

export interface MissionTrackingData {
  mission: {
    id: number;
    mission_code: string;
    title: string;
    status: string;
    priority: string;
    driver_name: string;
    vehicle_plate: string;
  };
  current_position: GPSPosition | null;
  last_update: string | null;
  origin: {
    address: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };
  schedule: {
    scheduled_start: string;
    scheduled_end: string;
    actual_start: string | null;
    actual_end: string | null;
  };
  delay_status: DelayStatus;
  alerts: MissionAlert[];
  alerts_count: number;
}

export interface ActiveTrackingMission {
  id: number;
  mission_code: string;
  title: string;
  status: string;
  priority: string;
  driver_name: string;
  vehicle_plate: string;
  origin: {
    address: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };
  current_position: GPSPosition | null;
  last_update: string | null;
  delay_status: DelayStatus;
  alerts_count: number;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
}

export interface ActiveTrackingResponse {
  count: number;
  missions: ActiveTrackingMission[];
}

export const missionsApi = {
  getAll: async (filters?: MissionFilters): Promise<MissionListResponse> => {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const queryString = params.toString();
    const url = queryString ? `/missions/?${queryString}` : '/missions/';

    const response = await apiClient.get<MissionListResponse>(url);
    return response.data;
  },

  getById: async (id: number): Promise<Mission> => {
    const response = await apiClient.get<Mission>(`/missions/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Mission>): Promise<Mission> => {
    const response = await apiClient.post<Mission>('/missions/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Mission>): Promise<Mission> => {
    const response = await apiClient.put<Mission>(`/missions/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/missions/${id}/`);
  },

  start: async (id: number): Promise<{ message: string; mission: Mission }> => {
    const response = await apiClient.post(`/missions/${id}/start/`);
    return response.data;
  },

  complete: async (id: number, signature?: File): Promise<{ message: string; mission: Mission }> => {
    const formData = new FormData();
    if (signature) {
      formData.append('signature', signature);
    }
    const response = await apiClient.post(`/missions/${id}/complete/`, formData);
    return response.data;
  },

  cancel: async (id: number, reason: string): Promise<{ message: string; mission: Mission }> => {
    const response = await apiClient.post(`/missions/${id}/cancel/`, { reason });
    return response.data;
  },

  updateDetails: async (id: number, data: Partial<Mission>): Promise<{ message: string; mission: Mission; changes: string[] }> => {
    const response = await apiClient.post(`/missions/${id}/update_details/`, data);
    return response.data;
  },

  getMyMissions: async (): Promise<Mission[]> => {
    const response = await apiClient.get<Mission[]>('/missions/my_missions/');
    return response.data;
  },

  getPending: async (): Promise<Mission[]> => {
    const response = await apiClient.get<Mission[]>('/missions/pending/');
    return response.data;
  },

  assign: async (id: number, driverId: number, vehicleId: number): Promise<{ message: string; mission: Mission }> => {
    const response = await apiClient.post(`/missions/${id}/assign/`, {
      driver_id: driverId,
      vehicle_id: vehicleId,
    });
    return response.data;
  },

  // Tracking methods
  getTracking: async (id: number): Promise<MissionTrackingData> => {
    const response = await apiClient.get<MissionTrackingData>(`/missions/${id}/tracking/`);
    return response.data;
  },

  getActiveTracking: async (): Promise<ActiveTrackingResponse> => {
    const response = await apiClient.get<ActiveTrackingResponse>('/missions/active_tracking/');
    return response.data;
  },

  updatePosition: async (id: number, position: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    battery_level?: number;
    is_moving?: boolean;
  }): Promise<{ message: string; point_id: number; recorded_at: string }> => {
    const response = await apiClient.post(`/missions/${id}/update_position/`, position);
    return response.data;
  },

  acknowledgeAlert: async (id: number, alertId: number): Promise<{ message: string; alert_id: number }> => {
    const response = await apiClient.post(`/missions/${id}/acknowledge_alert/`, { alert_id: alertId });
    return response.data;
  },

  getTripHistory: async (id: number): Promise<TripHistoryResponse> => {
    const response = await apiClient.get<TripHistoryResponse>(`/missions/${id}/trip_history/`);
    return response.data;
  },
};

export interface TripHistoryResponse {
  mission: {
    id: number;
    mission_code: string;
    title: string;
    status: string;
    priority: string;
    driver_name: string | null;
    vehicle_plate: string | null;
  };
  trip: {
    id: number;
    status: string;
    start_time: string | null;
    end_time: string | null;
    total_distance: number;
    total_duration_minutes: number;
    pause_duration_minutes: number;
    average_speed: number;
    max_speed: number;
    fuel_consumed: number | null;
  };
  origin: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  route: {
    total_points: number;
    points: RoutePoint[];
  };
  stops: {
    count: number;
    points: StopPoint[];
  };
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number | null;
  altitude: number | null;
  accuracy: number;
  is_moving: boolean;
  recorded_at: string;
}

export interface StopPoint {
  latitude: number;
  longitude: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}
