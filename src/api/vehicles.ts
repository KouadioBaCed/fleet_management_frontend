import { apiClient } from './client';
import type { Vehicle, VehicleDocument, DocumentAlert } from '@/types';

export interface VehicleFilters {
  status?: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  search?: string;
  fuel_type?: string;
  vehicle_type?: string;
  ordering?: string;
}

export interface VehicleStats {
  total: number;
  available: number;
  in_use: number;
  maintenance: number;
  out_of_service: number;
}

export interface VehicleListResponse {
  results: Vehicle[];
  stats: VehicleStats;
  count: number;
}

export interface VehicleCreateData {
  license_plate: string;
  vin_number: string;
  brand: string;
  model: string;
  year: number;
  vehicle_type: string;
  color: string;
  fuel_type: string;
  fuel_capacity: number;
  fuel_consumption: number;
  current_mileage: number;
  insurance_number: string;
  insurance_expiry: string;
  gps_device_id?: string;
  notes?: string;
  photo?: File;
}

export interface ApiValidationError {
  [key: string]: string[];
}

export interface TripHistory {
  id: number;
  start_time: string;
  end_time: string | null;
  start_location: string;
  end_location: string | null;
  distance: number;
  status: string;
  driver_name?: string;
}

export interface MaintenanceHistory {
  id: number;
  maintenance_type: string;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  description: string;
  service_provider: string;
  total_cost: number;
  mileage_at_service: number;
}

export interface CurrentDriver {
  id: number;
  employee_id: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
  };
  status: string;
  rating: number;
  total_trips: number;
  total_distance: number;
  driver_license_number: string;
  driver_license_expiry: string;
  driver_license_category: string;
}

export interface VehicleDetailsResponse {
  vehicle: Vehicle;
  trips: TripHistory[];
  maintenance: MaintenanceHistory[];
  current_driver: CurrentDriver | null;
}

export const vehiclesApi = {
  getAll: async (filters?: VehicleFilters): Promise<VehicleListResponse> => {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.fuel_type) params.append('fuel_type', filters.fuel_type);
    if (filters?.vehicle_type) params.append('vehicle_type', filters.vehicle_type);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const queryString = params.toString();
    const url = queryString ? `/vehicles/?${queryString}` : '/vehicles/';

    const response = await apiClient.get<VehicleListResponse>(url);
    return response.data;
  },

  getById: async (id: number): Promise<Vehicle> => {
    const response = await apiClient.get<Vehicle>(`/vehicles/${id}/`);
    return response.data;
  },

  create: async (data: FormData | Partial<Vehicle>): Promise<Vehicle> => {
    // Si c'est un FormData, on envoie avec multipart/form-data
    if (data instanceof FormData) {
      const response = await apiClient.post<Vehicle>('/vehicles/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    // Sinon, JSON classique
    const response = await apiClient.post<Vehicle>('/vehicles/', data);
    return response.data;
  },

  update: async (id: number, data: FormData | Partial<Vehicle>): Promise<Vehicle> => {
    // Si c'est un FormData, on envoie avec multipart/form-data
    if (data instanceof FormData) {
      const response = await apiClient.put<Vehicle>(`/vehicles/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    const response = await apiClient.put<Vehicle>(`/vehicles/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}/`);
  },

  getAvailable: async (): Promise<Vehicle[]> => {
    const response = await apiClient.get<Vehicle[]>('/vehicles/available/');
    return response.data;
  },

  getStats: async (): Promise<{
    total: number;
    by_status: VehicleStats;
    by_fuel_type: Record<string, number>;
    by_vehicle_type: Record<string, number>;
  }> => {
    const response = await apiClient.get('/vehicles/stats/');
    return response.data;
  },

  getHistory: async (id: number) => {
    const response = await apiClient.get(`/vehicles/${id}/history/`);
    return response.data;
  },

  getMaintenanceHistory: async (id: number) => {
    const response = await apiClient.get(`/vehicles/${id}/maintenance_history/`);
    return response.data;
  },

  getCurrentDriver: async (id: number) => {
    const response = await apiClient.get(`/vehicles/${id}/current_driver/`);
    return response.data;
  },

  getDetails: async (id: number): Promise<VehicleDetailsResponse> => {
    const response = await apiClient.get<VehicleDetailsResponse>(`/vehicles/${id}/details/`);
    return response.data;
  },

  changeStatus: async (id: number, status: string): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>(`/vehicles/${id}/change_status/`, { status });
    return response.data;
  },

  assignDriver: async (id: number, driverId: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`/vehicles/${id}/assign_driver/`, { driver_id: driverId });
    return response.data;
  },

  unassignDriver: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`/vehicles/${id}/unassign_driver/`);
    return response.data;
  },
};

export const vehicleDocumentsApi = {
  getByVehicle: async (vehicleId: number): Promise<VehicleDocument[]> => {
    const response = await apiClient.get<VehicleDocument[]>(`/vehicles/${vehicleId}/documents/`);
    return response.data;
  },

  create: async (vehicleId: number, data: FormData): Promise<VehicleDocument> => {
    const response = await apiClient.post<VehicleDocument>(`/vehicles/${vehicleId}/documents/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (vehicleId: number, documentId: number, data: FormData): Promise<VehicleDocument> => {
    const response = await apiClient.put<VehicleDocument>(`/vehicles/${vehicleId}/documents/${documentId}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (vehicleId: number, documentId: number): Promise<void> => {
    await apiClient.delete(`/vehicles/${vehicleId}/documents/${documentId}/`);
  },

  getAlerts: async (): Promise<DocumentAlert[]> => {
    const response = await apiClient.get<DocumentAlert[]>('/vehicles/document-alerts/');
    return response.data;
  },
};

// Alias for backwards compatibility
export const vehicleApi = vehiclesApi;
