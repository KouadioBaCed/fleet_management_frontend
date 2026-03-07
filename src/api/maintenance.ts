import { apiClient } from './client';

export interface Maintenance {
  id: number;
  organization: number | null;
  vehicle: number;
  vehicle_plate: string;
  maintenance_type: 'oil_change' | 'tire_change' | 'brake_service' | 'inspection' | 'repair' | 'preventive' | 'other';
  maintenance_type_display: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  status_display: string;
  scheduled_date: string;
  completed_date: string | null;
  mileage_at_service: number;
  next_service_mileage: number | null;
  description: string;
  work_performed: string;
  parts_replaced: string;
  service_provider: string;
  technician_name: string;
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  invoice: string | null;
  receipt: string | null;
  notes: string;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceFilters {
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'all';
  maintenance_type?: 'oil_change' | 'tire_change' | 'brake_service' | 'inspection' | 'repair' | 'preventive' | 'other' | 'all';
  vehicle?: number;
  search?: string;
  ordering?: string;
}

export interface MaintenanceStats {
  total: number;
  by_status: {
    scheduled: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  by_type: {
    oil_change: number;
    tire_change: number;
    brake_service: number;
    inspection: number;
    repair: number;
    preventive: number;
    other: number;
  };
  this_month_cost: number;
}

export interface MaintenanceListResponse {
  results: Maintenance[];
  count: number;
  stats: MaintenanceStats;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  status: string;
  status_display: string;
  maintenance_type: string;
  maintenance_type_display: string;
  vehicle_id: number;
  vehicle_plate: string;
  vehicle_brand: string;
  vehicle_model: string;
  description: string;
  service_provider: string;
  total_cost: number;
  mileage_at_service: number;
}

export interface CalendarResponse {
  start_date: string;
  end_date: string;
  count: number;
  events: CalendarEvent[];
}

export interface MileageAlert {
  id: number;
  vehicle_id: number;
  vehicle_plate: string;
  vehicle_brand: string;
  vehicle_model: string;
  current_mileage: number;
  next_maintenance_mileage: number;
  remaining_km: number;
  percentage: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  last_maintenance_date: string | null;
  last_maintenance_type: string | null;
}

export interface MileageAlertsResponse {
  count: number;
  alerts: MileageAlert[];
}

export interface PreventiveScheduleItem {
  month: string;
  count: number;
  total_cost: number;
  maintenances: {
    id: number;
    date: string;
    vehicle_plate: string;
    description: string;
    cost: number;
  }[];
}

export interface PreventiveScheduleResponse {
  schedule: PreventiveScheduleItem[];
}

export interface CreateMaintenanceData {
  vehicle: number;
  maintenance_type: string;
  scheduled_date: string;
  mileage_at_service: number;
  description: string;
  service_provider: string;
  total_cost: number;
  labor_cost?: number;
  parts_cost?: number;
  next_service_mileage?: number;
  notes?: string;
}

export interface CompleteMaintenanceData {
  work_performed?: string;
  parts_replaced?: string;
  current_mileage?: number;
  next_service_mileage?: number;
}

export interface HistoryIntervention {
  id: number;
  vehicle_id: number;
  vehicle_plate: string;
  vehicle_brand: string;
  vehicle_model: string;
  maintenance_type: string;
  maintenance_type_display: string;
  scheduled_date: string | null;
  completed_date: string | null;
  description: string;
  work_performed: string;
  parts_replaced: string[];
  parts_replaced_raw: string;
  service_provider: string;
  technician_name: string;
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  mileage_at_service: number;
  next_service_mileage: number | null;
}

export interface CumulativeCosts {
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
}

export interface TypeStats {
  label: string;
  count: number;
  total_cost: number;
}

export interface MonthlyCosts {
  month: string;
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  count: number;
}

export interface HistoryResponse {
  count: number;
  interventions: HistoryIntervention[];
  cumulative_costs: CumulativeCosts;
  by_type: TypeStats[];
  monthly_costs: MonthlyCosts[];
}

export const maintenanceApi = {
  getAll: async (filters?: MaintenanceFilters): Promise<MaintenanceListResponse> => {
    const params = new URLSearchParams();

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.maintenance_type && filters.maintenance_type !== 'all') {
      params.append('maintenance_type', filters.maintenance_type);
    }
    if (filters?.vehicle) {
      params.append('vehicle', String(filters.vehicle));
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.ordering) {
      params.append('ordering', filters.ordering);
    }

    const queryString = params.toString();
    const url = queryString ? `/maintenance/?${queryString}` : '/maintenance/';

    const response = await apiClient.get<MaintenanceListResponse>(url);
    return response.data;
  },

  getById: async (id: number): Promise<Maintenance> => {
    const response = await apiClient.get<Maintenance>(`/maintenance/${id}/`);
    return response.data;
  },

  create: async (data: CreateMaintenanceData): Promise<Maintenance> => {
    const response = await apiClient.post<Maintenance>('/maintenance/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Maintenance>): Promise<Maintenance> => {
    const response = await apiClient.patch<Maintenance>(`/maintenance/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/maintenance/${id}/`);
  },

  getUpcoming: async (): Promise<Maintenance[]> => {
    const response = await apiClient.get<Maintenance[]>('/maintenance/upcoming/');
    return response.data;
  },

  getCalendar: async (startDate?: string, endDate?: string): Promise<CalendarResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);

    const queryString = params.toString();
    const url = queryString ? `/maintenance/calendar/?${queryString}` : '/maintenance/calendar/';

    const response = await apiClient.get<CalendarResponse>(url);
    return response.data;
  },

  getMileageAlerts: async (): Promise<MileageAlertsResponse> => {
    const response = await apiClient.get<MileageAlertsResponse>('/maintenance/mileage_alerts/');
    return response.data;
  },

  getPreventiveSchedule: async (): Promise<PreventiveScheduleResponse> => {
    const response = await apiClient.get<PreventiveScheduleResponse>('/maintenance/preventive_schedule/');
    return response.data;
  },

  start: async (id: number): Promise<{ message: string; maintenance: Maintenance }> => {
    const response = await apiClient.post(`/maintenance/${id}/start/`);
    return response.data;
  },

  complete: async (id: number, data?: CompleteMaintenanceData): Promise<{ message: string; maintenance: Maintenance }> => {
    const response = await apiClient.post(`/maintenance/${id}/complete/`, data || {});
    return response.data;
  },

  cancel: async (id: number, reason?: string): Promise<{ message: string; maintenance: Maintenance }> => {
    const response = await apiClient.post(`/maintenance/${id}/cancel/`, { reason });
    return response.data;
  },

  getHistory: async (vehicleId?: number): Promise<HistoryResponse> => {
    const params = new URLSearchParams();
    if (vehicleId) params.append('vehicle', String(vehicleId));

    const queryString = params.toString();
    const url = queryString ? `/maintenance/history/?${queryString}` : '/maintenance/history/';

    const response = await apiClient.get<HistoryResponse>(url);
    return response.data;
  },
};
