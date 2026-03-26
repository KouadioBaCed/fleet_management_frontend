import { apiClient } from './client';

export type AnalyticsPeriod = 'week' | 'month' | 'last_month' | '3_months' | '6_months' | 'year' | 'custom';

export interface AnalyticsFilters {
  period?: AnalyticsPeriod;
  start_date?: string;
  end_date?: string;
}

export interface StatValue {
  value: number;
  change: number;
}

export interface VehicleConsumption {
  vehicle_id: number;
  plate: string;
  brand: string;
  model: string;
  vehicle_type: string;
  fuel_type: string;
  total_quantity: number;
  fuel_cost: number;
  maintenance_cost: number;
  total_cost: number;
  cost_change: number;
  avg_consumption: number;
  consumption_change: number;
  expected_consumption: number;
  efficiency_ratio: number;
  distance: number;
  cost_per_km: number;
  refuel_count: number;
  avg_price: number;
  status: 'efficient' | 'warning' | 'critical';
}

export interface MonthlyTrend {
  month: string;
  label: string;
  fuel_cost: number;
  maintenance_cost: number;
  incident_cost: number;
  total_cost: number;
  quantity: number;
  distance: number;
  avg_consumption: number;
}

export interface CostBreakdown {
  by_category: {
    fuel: {
      amount: number;
      percentage: number;
      change: number;
    };
    maintenance: {
      amount: number;
      percentage: number;
      change: number;
    };
    incidents: {
      amount: number;
      percentage: number;
      change: number;
    };
  };
  maintenance_detail: {
    parts: number;
    labor: number;
  };
}

export interface DriverAnalyticsItem {
  id: number;
  full_name: string;
  employee_id: string;
  photo: string | null;
  status: string;
  rating: number;
  total_missions: number;
  completed_missions: number;
  cancelled_missions: number;
  late_count: number;
  late_rate: number;
  incident_count: number;
  incident_rate: number;
}

export interface VehicleAnalyticsItem {
  id: number;
  license_plate: string;
  brand: string;
  model: string;
  current_mileage: number;
  fuel_type: string;
  status: string;
  avg_consumption: number;
  total_fuel_quantity: number;
  fuel_cost: number;
  maintenance_cost: number;
  preventive_count: number;
  preventive_cost: number;
  corrective_count: number;
  corrective_cost: number;
  incident_count: number;
  mission_count: number;
  total_cost: number;
}

export interface IncidentTypeStats {
  count: number;
  cost: number;
  avg_cost: number;
}

export interface IncidentLocation {
  id: number;
  lat: number;
  lng: number;
  type: string;
  severity: string;
  title: string;
  address: string;
}

export interface FleetAnalytics {
  period: {
    start: string;
    end: string;
    label: string;
  };
  summary: {
    total_cost: StatValue;
    fuel_cost: StatValue;
    maintenance_cost: StatValue;
    incident_cost: StatValue;
    incident_count: number;
    incident_resolved: number;
    total_distance: StatValue;
    total_quantity: StatValue;
    avg_consumption: StatValue;
    cost_per_km: StatValue;
    vehicles_count: number;
    efficiency_distribution: {
      efficient: number;
      warning: number;
      critical: number;
    };
  };
  cost_breakdown: CostBreakdown;
  vehicle_consumption: VehicleConsumption[];
  monthly_trends: MonthlyTrend[];
  top_consumers: VehicleConsumption[];
  top_costly: VehicleConsumption[];
  driver_analytics: DriverAnalyticsItem[];
  driver_status_distribution: {
    available: number;
    on_mission: number;
    on_break: number;
    off_duty: number;
  };
  vehicle_analytics: VehicleAnalyticsItem[];
  incident_analytics: {
    by_type: Record<string, IncidentTypeStats>;
    avg_cost: number;
    total_count: number;
    resolved_count: number;
    locations: IncidentLocation[];
  };
  financial: {
    cost_per_driver: Array<{
      id: number;
      full_name: string;
      fuel_cost: number;
      incident_cost: number;
      total_cost: number;
    }>;
    mission_costs: Array<{
      mission_code: string;
      title: string;
      driver_name: string | null;
      vehicle_plate: string | null;
      fuel_cost: number;
    }>;
    budget_summary: {
      fuel: number;
      maintenance: number;
      incidents: number;
      total: number;
      maintenance_parts: number;
      maintenance_labor: number;
    };
  };
}

export const analyticsApi = {
  getFleetAnalytics: async (filters?: AnalyticsFilters): Promise<FleetAnalytics> => {
    const params = new URLSearchParams();

    if (filters?.period) params.append('period', filters.period);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const queryString = params.toString();
    const url = queryString ? `/analytics/fleet/?${queryString}` : '/analytics/fleet/';

    const response = await apiClient.get<FleetAnalytics>(url);
    return response.data;
  }
};
