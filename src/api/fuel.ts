import { apiClient } from './client';

export interface FuelRecord {
  id: number;
  organization: number | null;
  vehicle: number;
  vehicle_plate: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  driver: number | null;
  driver_name: string | null;
  trip: number | null;
  refuel_date: string;
  station_name: string;
  station_address: string;
  latitude: number | null;
  longitude: number | null;
  fuel_type: 'gasoline' | 'diesel' | 'electric';
  fuel_type_display: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  mileage_at_refuel: number;
  distance_since_last_refuel: number | null;
  calculated_consumption: number | null;
  is_full_tank: boolean;
  receipt_photo: string | null;
  receipt_number: string;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
}

export interface FuelFilters {
  vehicle?: number;
  driver?: number;
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'all';
  start_date?: string;
  end_date?: string;
  search?: string;
  ordering?: string;
}

export interface FuelStats {
  total_records: number;
  total_quantity: number;
  total_cost: number;
  average_consumption: number;
  average_unit_price: number;
  by_fuel_type: {
    gasoline: { count: number; quantity: number; cost: number };
    diesel: { count: number; quantity: number; cost: number };
    electric: { count: number; quantity: number; cost: number };
  };
  by_vehicle: {
    vehicle_id: number;
    vehicle_plate: string;
    total_quantity: number;
    total_cost: number;
    avg_consumption: number;
  }[];
  monthly_data: {
    month: string;
    quantity: number;
    cost: number;
    records: number;
  }[];
}

export interface FuelListResponse {
  results: FuelRecord[];
  count: number;
  stats: FuelStats;
}

export interface CreateFuelData {
  vehicle: number;
  driver?: number;
  refuel_date: string;
  station_name: string;
  station_address?: string;
  latitude?: number;
  longitude?: number;
  fuel_type: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  mileage_at_refuel: number;
  is_full_tank?: boolean;
  receipt_number?: string;
  notes?: string;
}

export type UpdateFuelData = Partial<CreateFuelData>;

export interface VehicleFuelStats {
  vehicle_id: number;
  total_quantity: number;
  total_cost: number;
  average_consumption: number;
  records_count: number;
}

export interface ConsumptionReport {
  vehicle_id: number;
  vehicle_plate: string;
  average_consumption: number;
  expected_consumption: number;
  difference: number;
}

// Analytics Types
export interface VehicleAnalytics {
  vehicle_id: number;
  vehicle_plate: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_type: string;
  fuel_type: string;
  fuel_type_display: string;
  total_quantity: number;
  total_cost: number;
  total_distance: number;
  refuel_count: number;
  avg_consumption: number;
  expected_consumption: number;
  consumption_diff: number;
  efficiency_ratio: number;
  cost_per_km: number;
  avg_unit_price: number;
  monthly_trend: { month: string; consumption: number | null }[];
  status: 'efficient' | 'warning' | 'critical';
}

export interface FleetSummary {
  total_vehicles: number;
  total_distance: number;
  total_cost: number;
  total_quantity: number;
  avg_consumption: number;
  cost_per_km: number;
  efficiency_distribution: {
    efficient: number;
    warning: number;
    critical: number;
  };
}

export interface TypeComparison {
  count: number;
  total_cost: number;
  total_distance: number;
  avg_consumption: number;
  cost_per_km: number;
}

export interface FuelTypeComparison extends TypeComparison {
  label: string;
  total_quantity: number;
}

export interface FleetComparison {
  top_performers: VehicleAnalytics[];
  bottom_performers: VehicleAnalytics[];
  by_vehicle_type: Record<string, TypeComparison>;
  by_fuel_type: Record<string, FuelTypeComparison>;
}

export interface AnalyticsResponse {
  vehicles: VehicleAnalytics[];
  fleet_summary: FleetSummary;
  comparison: FleetComparison;
}

export const fuelApi = {
  getAll: async (filters?: FuelFilters): Promise<FuelListResponse> => {
    const params = new URLSearchParams();

    if (filters?.vehicle) params.append('vehicle', String(filters.vehicle));
    if (filters?.driver) params.append('driver', String(filters.driver));
    if (filters?.fuel_type && filters.fuel_type !== 'all') {
      params.append('fuel_type', filters.fuel_type);
    }
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const queryString = params.toString();
    const url = queryString ? `/fuel/?${queryString}` : '/fuel/';

    const response = await apiClient.get<FuelListResponse>(url);
    return response.data;
  },

  getById: async (id: number): Promise<FuelRecord> => {
    const response = await apiClient.get<FuelRecord>(`/fuel/${id}/`);
    return response.data;
  },

  create: async (data: CreateFuelData): Promise<FuelRecord> => {
    const response = await apiClient.post<FuelRecord>('/fuel/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateFuelData>): Promise<FuelRecord> => {
    const response = await apiClient.patch<FuelRecord>(`/fuel/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/fuel/${id}/`);
  },

  getVehicleStats: async (vehicleId: number): Promise<VehicleFuelStats> => {
    const response = await apiClient.get<VehicleFuelStats>(`/fuel/vehicle/${vehicleId}/stats/`);
    return response.data;
  },

  getConsumptionReport: async (): Promise<ConsumptionReport[]> => {
    const response = await apiClient.get<ConsumptionReport[]>('/fuel/consumption_report/');
    return response.data;
  },

  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const response = await apiClient.get<AnalyticsResponse>('/fuel/analytics/');
    return response.data;
  },
};

export type { FuelRecord as Fuel };
