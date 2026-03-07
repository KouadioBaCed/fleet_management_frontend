import { apiClient } from './client';

export interface Incident {
  id: number;
  organization: number | null;
  trip: number;
  driver: number;
  vehicle: number;
  incident_type: 'flat_tire' | 'breakdown' | 'accident' | 'fuel_issue' | 'traffic_violation' | 'other';
  incident_type_display: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  severity_display: string;
  title: string;
  description: string;
  latitude: string;
  longitude: string;
  address: string;
  photo1: string | null;
  photo2: string | null;
  photo3: string | null;
  is_resolved: boolean;
  resolution_notes: string;
  resolved_at: string | null;
  resolved_by: number | null;
  resolved_by_name: string | null;
  estimated_cost: string | null;
  reported_at: string;
  updated_at: string;
  vehicle_plate: string;
  driver_name: string;
}

export interface IncidentFilters {
  incident_type?: 'flat_tire' | 'breakdown' | 'accident' | 'fuel_issue' | 'traffic_violation' | 'other' | 'all';
  severity?: 'minor' | 'moderate' | 'major' | 'critical' | 'all';
  is_resolved?: boolean;
  search?: string;
  ordering?: string;
}

export interface IncidentStats {
  total: number;
  by_severity: {
    minor: number;
    moderate: number;
    major: number;
    critical: number;
  };
  by_type: {
    flat_tire: number;
    breakdown: number;
    accident: number;
    fuel_issue: number;
    traffic_violation: number;
    other: number;
  };
  by_status: {
    unresolved: number;
    resolved: number;
  };
}

export interface IncidentListResponse {
  results: Incident[];
  count: number;
  stats: IncidentStats;
}

export interface CreateIncidentData {
  trip?: number;
  driver?: number;
  vehicle?: number;
  incident_type: string;
  severity: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  estimated_cost?: number;
  resolution_notes?: string;
  photo1?: File;
  photo2?: File;
  photo3?: File;
}

export interface ResolveIncidentData {
  resolution_notes?: string;
  estimated_cost?: number;
}

export type IncidentAnalyticsPeriod = 'week' | 'month' | 'last_month' | '3_months' | '6_months' | 'year' | 'custom';

export interface IncidentAnalyticsFilters {
  period?: IncidentAnalyticsPeriod;
  start_date?: string;
  end_date?: string;
}

export interface TypeStats {
  label: string;
  count: number;
  percentage: number;
  cost: number;
  resolved: number;
  unresolved: number;
}

export interface SeverityStats {
  label: string;
  color: string;
  count: number;
  percentage: number;
  cost: number;
  avg_cost: number;
  resolved: number;
  unresolved: number;
}

export interface MonthlyTrend {
  month: string;
  label: string;
  count: number;
  cost: number;
  resolved: number;
  by_severity: {
    minor: number;
    moderate: number;
    major: number;
    critical: number;
  };
}

export interface RecentIncident {
  id: number;
  title: string;
  type: string;
  type_display: string;
  severity: string;
  severity_display: string;
  vehicle_plate: string | null;
  driver_name: string | null;
  cost: number | null;
  is_resolved: boolean;
  reported_at: string;
}

export interface TopVehicle {
  vehicle_id: number;
  plate: string;
  brand: string;
  model: string;
  count: number;
  cost: number;
}

export interface TopDriver {
  driver_id: number;
  name: string;
  count: number;
  cost: number;
}

export interface CostByType {
  type: string;
  label: string;
  cost: number;
  count: number;
}

export interface IncidentAnalytics {
  period: {
    start: string;
    end: string;
    label: string;
  };
  summary: {
    total_count: number;
    count_change: number;
    resolved_count: number;
    unresolved_count: number;
    resolution_rate: number;
    total_cost: number;
    cost_change: number;
    avg_cost: number;
  };
  by_type: Record<string, TypeStats>;
  by_severity: Record<string, SeverityStats>;
  costs_by_type: CostByType[];
  monthly_trends: MonthlyTrend[];
  recent_incidents: RecentIncident[];
  top_vehicles: TopVehicle[];
  top_drivers: TopDriver[];
}

export const incidentsApi = {
  getAll: async (filters?: IncidentFilters): Promise<IncidentListResponse> => {
    const params = new URLSearchParams();

    if (filters?.incident_type && filters.incident_type !== 'all') {
      params.append('incident_type', filters.incident_type);
    }
    if (filters?.severity && filters.severity !== 'all') {
      params.append('severity', filters.severity);
    }
    if (filters?.is_resolved !== undefined) {
      params.append('is_resolved', String(filters.is_resolved));
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.ordering) {
      params.append('ordering', filters.ordering);
    }

    const queryString = params.toString();
    const url = queryString ? `/incidents/?${queryString}` : '/incidents/';

    const response = await apiClient.get<IncidentListResponse>(url);
    return response.data;
  },

  getById: async (id: number): Promise<Incident> => {
    const response = await apiClient.get<Incident>(`/incidents/${id}/`);
    return response.data;
  },

  create: async (data: FormData | CreateIncidentData): Promise<Incident> => {
    // Send FormData directly - axios will automatically set the correct Content-Type with boundary
    const response = await apiClient.post<Incident>('/incidents/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Incident>): Promise<Incident> => {
    const response = await apiClient.patch<Incident>(`/incidents/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/incidents/${id}/`);
  },

  getUnresolved: async (): Promise<Incident[]> => {
    const response = await apiClient.get<Incident[]>('/incidents/unresolved/');
    return response.data;
  },

  resolve: async (id: number, data?: ResolveIncidentData): Promise<{ message: string; incident: Incident }> => {
    const response = await apiClient.post(`/incidents/${id}/resolve/`, data || {});
    return response.data;
  },

  reopen: async (id: number): Promise<{ message: string; incident: Incident }> => {
    const response = await apiClient.post(`/incidents/${id}/reopen/`);
    return response.data;
  },

  getAnalytics: async (filters?: IncidentAnalyticsFilters): Promise<IncidentAnalytics> => {
    const params = new URLSearchParams();

    if (filters?.period) params.append('period', filters.period);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const queryString = params.toString();
    const url = queryString ? `/incidents/analytics/?${queryString}` : '/incidents/analytics/';

    const response = await apiClient.get<IncidentAnalytics>(url);
    return response.data;
  },
};
