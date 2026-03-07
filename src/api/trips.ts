import { apiClient } from './client';

export interface Trip {
  id: number;
  mission: number;
  vehicle: number;
  driver: number;
  start_time: string;
  end_time: string | null;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  start_mileage: number;
  end_mileage: number | null;
  start_fuel_level: number;
  end_fuel_level: number | null;
  total_distance: number;
  total_duration_minutes: number;
  pause_duration_minutes: number;
  average_speed: number;
  max_speed: number;
}

export interface TripPause {
  id: number;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  reason: string;
  reason_display: string;
  notes: string;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface PauseData {
  reason?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export const tripsApi = {
  getAll: async () => {
    const response = await apiClient.get<Trip[]>('/trips/');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Trip>(`/trips/${id}/`);
    return response.data;
  },

  getActive: async () => {
    const response = await apiClient.get<Trip[]>('/trips/active/');
    return response.data;
  },

  create: async (data: {
    mission: number;
    start_mileage: number;
    start_fuel_level: number;
  }) => {
    const response = await apiClient.post<Trip>('/trips/', data);
    return response.data;
  },

  pause: async (id: number, data?: PauseData) => {
    const response = await apiClient.post<{
      message: string;
      trip: Trip;
      pause: {
        id: number;
        started_at: string;
        reason: string;
      };
    }>(`/trips/${id}/pause/`, data || {});
    return response.data;
  },

  resume: async (id: number) => {
    const response = await apiClient.post<{
      message: string;
      trip: Trip;
      pause_duration_minutes: number;
      total_pause_minutes: number;
    }>(`/trips/${id}/resume/`);
    return response.data;
  },

  complete: async (id: number, data: {
    end_mileage: number;
    end_fuel_level: number;
    notes?: string;
  }) => {
    const response = await apiClient.post<{
      message: string;
      trip: Trip;
    }>(`/trips/${id}/complete/`, data);
    return response.data;
  },

  getPauses: async (id: number) => {
    const response = await apiClient.get<{
      pauses: TripPause[];
      total_pause_minutes: number;
      pauses_count: number;
    }>(`/trips/${id}/pauses/`);
    return response.data;
  },

  getRoute: async (id: number) => {
    const response = await apiClient.get<any[]>(`/trips/${id}/route/`);
    return response.data;
  },

  getAnalytics: async (id: number) => {
    const response = await apiClient.get<{
      total_distance: number;
      total_duration_minutes: number;
      average_speed: number;
      max_speed: number;
      fuel_consumed: number;
      has_incidents: boolean;
      incidents_count: number;
      points_count: number;
    }>(`/trips/${id}/analytics/`);
    return response.data;
  },
};
