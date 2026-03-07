import { apiClient } from './client';

export type PeriodType = 'today' | 'week' | 'month' | 'last_month' | '3_months' | '6_months' | 'year' | 'custom';

export interface ReportFilters {
  period?: PeriodType;
  start_date?: string;
  end_date?: string;
  vehicle?: number;
  driver?: number;
}

export interface StatValue {
  value: number;
  change: number;
  unit?: string;
}

export interface TopVehicle {
  vehicle_id: number;
  plate: string;
  brand: string;
  model: string;
  trips: number;
  distance: number;
  fuel: number;
  efficiency: number;
}

export interface TopDriver {
  driver_id: number;
  name: string;
  trips: number;
  distance: number;
  incidents: number;
}

export interface WeeklyData {
  date: string;
  day: string;
  trips: number;
  distance: number;
  fuel_cost: number;
}

export interface MonthlyData {
  month: string;
  label: string;
  trips: number;
  distance: number;
  fuel_quantity: number;
  fuel_cost: number;
  maintenance_cost: number;
}

export interface FuelByType {
  count: number;
  quantity: number;
  cost: number;
}

export interface ReportsSummary {
  period: {
    start: string;
    end: string;
    label: string;
  };
  filters: {
    vehicle_id: number | null;
    driver_id: number | null;
  };
  stats: {
    distance: StatValue;
    fuel: StatValue;
    fuel_cost: StatValue;
    maintenance_cost: StatValue;
    total_cost: StatValue;
    trips: StatValue;
    hours: StatValue;
    incidents: StatValue;
    avg_consumption: StatValue;
    availability: StatValue;
  };
  top_vehicles: TopVehicle[];
  top_drivers: TopDriver[];
  weekly_data: WeeklyData[];
  monthly_data: MonthlyData[];
  fuel_by_type: {
    gasoline: FuelByType;
    diesel: FuelByType;
    electric: FuelByType;
  };
  fleet: {
    total_vehicles: number;
    total_drivers: number;
  };
}

export type ExportType = 'all' | 'fuel' | 'trips' | 'maintenance' | 'incidents';

export const reportsApi = {
  getSummary: async (filters?: ReportFilters): Promise<ReportsSummary> => {
    const params = new URLSearchParams();

    if (filters?.period) params.append('period', filters.period);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.vehicle) params.append('vehicle', String(filters.vehicle));
    if (filters?.driver) params.append('driver', String(filters.driver));

    const queryString = params.toString();
    const url = queryString ? `/reports/summary/?${queryString}` : '/reports/summary/';

    const response = await apiClient.get<ReportsSummary>(url);
    return response.data;
  },

  exportCSV: async (filters?: ReportFilters & { type?: ExportType }): Promise<Blob> => {
    const params = new URLSearchParams();

    if (filters?.type) params.append('type', filters.type);
    if (filters?.period) params.append('period', filters.period);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.vehicle) params.append('vehicle', String(filters.vehicle));
    if (filters?.driver) params.append('driver', String(filters.driver));

    const queryString = params.toString();
    const url = queryString ? `/reports/export/csv/?${queryString}` : '/reports/export/csv/';

    const response = await apiClient.get(url, {
      responseType: 'blob'
    });
    return response.data;
  },

  exportJSON: async (filters?: ReportFilters & { type?: ExportType }): Promise<any> => {
    const params = new URLSearchParams();

    if (filters?.type) params.append('type', filters.type);
    if (filters?.period) params.append('period', filters.period);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.vehicle) params.append('vehicle', String(filters.vehicle));
    if (filters?.driver) params.append('driver', String(filters.driver));

    const queryString = params.toString();
    const url = queryString ? `/reports/export/json/?${queryString}` : '/reports/export/json/';

    const response = await apiClient.get(url);
    return response.data;
  },

  downloadFile: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
