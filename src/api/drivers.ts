import { apiClient } from './client';
import type { Driver, Incident, IncidentStats } from '@/types';

// ===== ANALYTICS TYPES =====
export type DriverAnalyticsPeriod = 'week' | 'month' | 'last_month' | '3_months' | '6_months' | 'year' | 'custom';

export interface DriverAnalyticsFilters {
  period?: DriverAnalyticsPeriod;
  start_date?: string;
  end_date?: string;
}

export interface DriverMetric {
  id: number;
  name: string;
  employee_id: string;
  photo: string | null;
  status: string;
  status_display: string;
  trips_count: number;
  distance: number;
  incidents_count: number;
  incidents_resolved: number;
  fuel_cost: number;
  fuel_liters: number;
  efficiency: number;
  rating: number;
  score: number;
  rank: number;
  total_trips: number;
  total_distance: number;
}

export interface StatusDistribution {
  status: string;
  label: string;
  color: string;
  count: number;
  percentage: number;
}

export interface MonthlyTrendDriver {
  month: string;
  label: string;
  trips: number;
  distance: number;
  incidents: number;
  fuel_cost: number;
  active_drivers: number;
}

export interface IncidentsByDriver {
  driver_id: number;
  name: string;
  total: number;
  resolved: number;
  unresolved: number;
  by_severity: {
    minor: number;
    moderate: number;
    major: number;
    critical: number;
  };
}

export interface DriverAnalytics {
  period: {
    start: string;
    end: string;
    label: string;
  };
  summary: {
    total_drivers: number;
    active_drivers: number;
    total_trips: number;
    total_distance: number;
    avg_rating: number;
    period_trips: number;
    trips_change: number;
    period_distance: number;
    distance_change: number;
    period_incidents: number;
    incidents_change: number;
  };
  driver_metrics: DriverMetric[];
  comparison: {
    top_by_trips: DriverMetric[];
    top_by_distance: DriverMetric[];
    top_by_efficiency: DriverMetric[];
    top_by_rating: DriverMetric[];
    most_incidents: DriverMetric[];
  };
  monthly_trends: MonthlyTrendDriver[];
  status_distribution: StatusDistribution[];
  incidents_by_driver: IncidentsByDriver[];
}

export interface DriverFilters {
  status?: 'available' | 'on_mission' | 'on_break' | 'off_duty';
  search?: string;
  ordering?: string;
}

export interface DriverStats {
  total: number;
  available: number;
  on_mission: number;
  on_break: number;
  off_duty: number;
}

export interface DriverListResponse {
  results: Driver[];
  stats: DriverStats;
  count: number;
}

export interface DriverCreateData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  driver_license_number: string;
  driver_license_expiry: string;
  driver_license_category: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  hire_date?: string;
  notes?: string;
  photo?: File;
}

export interface ApiValidationError {
  [key: string]: string[];
}

export const driversApi = {
  getAll: async (filters?: DriverFilters): Promise<DriverListResponse> => {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const queryString = params.toString();
    const url = queryString ? `/drivers/?${queryString}` : '/drivers/';

    const response = await apiClient.get<DriverListResponse>(url);
    return response.data;
  },

  getById: async (id: number): Promise<Driver> => {
    const response = await apiClient.get<Driver>(`/drivers/${id}/`);
    return response.data;
  },

  create: async (data: FormData | Partial<Driver>): Promise<Driver> => {
    if (data instanceof FormData) {
      // Send FormData directly - backend now accepts flat structure
      const response = await apiClient.post<Driver>('/drivers/', data);
      return response.data;
    }
    const response = await apiClient.post<Driver>('/drivers/', data);
    return response.data;
  },

  update: async (id: number, data: FormData | Partial<Driver>): Promise<Driver> => {
    if (data instanceof FormData) {
      const response = await apiClient.put<Driver>(`/drivers/${id}/`, data);
      return response.data;
    }
    const response = await apiClient.put<Driver>(`/drivers/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/drivers/${id}/`);
  },

  getAvailable: async (): Promise<Driver[]> => {
    const response = await apiClient.get<Driver[]>('/drivers/available/');
    return response.data;
  },

  getStats: async (): Promise<{
    total: number;
    by_status: DriverStats;
  }> => {
    const response = await apiClient.get('/drivers/stats/');
    return response.data;
  },

  getStatistics: async (id: number): Promise<{
    total_trips: number;
    total_distance: number;
    rating: number;
    status: string;
    current_vehicle: string | null;
  }> => {
    const response = await apiClient.get(`/drivers/${id}/statistics/`);
    return response.data;
  },

  toggleStatus: async (id: number, status: string): Promise<{ message: string; status: string }> => {
    const response = await apiClient.post(`/drivers/${id}/toggle_status/`, { status });
    return response.data;
  },

  changeStatus: async (id: number, status: string): Promise<{ message: string; status: string }> => {
    const response = await apiClient.post(`/drivers/${id}/toggle_status/`, { status });
    return response.data;
  },

  getIncidents: async (id: number, filters?: {
    is_resolved?: boolean;
    severity?: 'minor' | 'moderate' | 'major' | 'critical';
    limit?: number;
  }): Promise<{ incidents: Incident[]; stats: IncidentStats }> => {
    const params = new URLSearchParams();

    if (filters?.is_resolved !== undefined) {
      params.append('is_resolved', String(filters.is_resolved));
    }
    if (filters?.severity) {
      params.append('severity', filters.severity);
    }
    if (filters?.limit) {
      params.append('limit', String(filters.limit));
    }

    const queryString = params.toString();
    const url = queryString ? `/drivers/${id}/incidents/?${queryString}` : `/drivers/${id}/incidents/`;

    const response = await apiClient.get(url);
    return response.data;
  },

  getAnalytics: async (filters?: DriverAnalyticsFilters): Promise<DriverAnalytics> => {
    const params = new URLSearchParams();

    if (filters?.period) params.append('period', filters.period);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const queryString = params.toString();
    const url = queryString ? `/drivers/analytics/?${queryString}` : '/drivers/analytics/';

    const response = await apiClient.get<DriverAnalytics>(url);
    return response.data;
  },
};
