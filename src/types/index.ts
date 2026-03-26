// Types pour l'application

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  is_active: boolean;
  subscription_type: 'trial' | 'basic' | 'professional' | 'enterprise';
  max_vehicles: number;
  max_drivers: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'supervisor' | 'driver';
  phone_number?: string;
  profile_picture?: string;
  is_active_duty: boolean;
  organization?: Organization;
}

export interface Vehicle {
  id: number;
  license_plate: string;
  vin_number: string;
  brand: string;
  model: string;
  year: number;
  vehicle_type: 'sedan' | 'suv' | 'van' | 'truck';
  color: string;
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  fuel_capacity: number;
  fuel_consumption: number;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  current_mileage: number;
  photo?: string;
  insurance_number?: string;
  insurance_expiry?: string;
  gps_device_id?: string;
  notes?: string;
  last_maintenance_date?: string;
  next_maintenance_mileage?: number;
  maintenance_frequency_km?: number;
  maintenance_frequency_months?: number;
  needs_maintenance?: boolean;
  maintenance_overdue?: boolean;
  next_maintenance_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Driver {
  id: number;
  employee_id: string;
  full_name: string;
  status: 'available' | 'on_mission' | 'on_break' | 'off_duty';
  rating: number;
  total_trips: number;
  total_distance: number;
  current_vehicle_plate?: string;
  email?: string;
  phone_number?: string;
  // Extended fields
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    profile_picture?: string;
  };
  driver_license_number?: string;
  driver_license_expiry?: string;
  driver_license_category?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  hire_date?: string;
  notes?: string;
  photo?: string;
  current_vehicle?: {
    id: number;
    license_plate: string;
    brand: string;
    model: string;
  };
  current_mission?: {
    id: number;
    mission_code: string;
    title: string;
    status: string;
    priority: string;
    origin_address: string;
    destination_address: string;
    scheduled_start: string;
    scheduled_end: string | null;
    actual_start: string | null;
  };
  created_at?: string;
  updated_at?: string;
}

export interface MissionCheckpoint {
  id?: number;
  order: number;
  address: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface Mission {
  id: number;
  mission_code: string;
  title: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  vehicle?: number;
  vehicle_plate: string;
  driver?: number;
  driver_name: string;
  scheduled_start: string;
  scheduled_end: string;
  origin_address: string;
  origin_latitude?: number;
  origin_longitude?: number;
  destination_address: string;
  destination_latitude?: number;
  destination_longitude?: number;
  estimated_distance: number;
  responsible_person_name?: string;
  responsible_person_phone?: string;
  actual_start?: string;
  actual_end?: string;
  checkpoints?: MissionCheckpoint[];
  checkpoint_count?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  active_trip?: {
    id: number;
    status: 'active' | 'paused';
    start_time: string;
    start_mileage: number;
    start_fuel_level: number;
    pause_duration_minutes: number;
  };
}

export interface Trip {
  id: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  start_time: string;
  end_time?: string;
  total_distance: number;
  average_speed: number;
  max_speed: number;
  fuel_consumed: number;
  has_incidents: boolean;
}

export interface GPSLocationPoint {
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  recorded_at: string;
}

export interface LivePosition {
  vehicleId: number;
  vehiclePlate: string;
  driverName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  tripId: number;
  missionCode: string;
}

export interface Incident {
  id: number;
  trip: number;
  driver: number;
  vehicle: number;
  incident_type: 'flat_tire' | 'breakdown' | 'accident' | 'fuel_issue' | 'traffic_violation' | 'other';
  incident_type_display: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  severity_display: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  photo1?: string;
  photo2?: string;
  photo3?: string;
  is_resolved: boolean;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: number;
  resolved_by_name?: string;
  estimated_cost?: number;
  reported_at: string;
  updated_at: string;
  vehicle_plate?: string;
  driver_name?: string;
}

export type VehicleDocumentType = 'carte_grise' | 'assurance' | 'visite_technique' | 'vignette';
export type VehicleDocumentStatus = 'valid' | 'expiring_soon' | 'expired';

export interface VehicleDocument {
  id: number;
  vehicle: number;
  document_type: VehicleDocumentType;
  document_number: string;
  issue_date: string;
  expiry_date: string;
  file?: string;
  file_name?: string;
  status: VehicleDocumentStatus;
  days_until_expiry?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentAlert {
  id: number;
  vehicle_id: number;
  vehicle_plate: string;
  vehicle_brand: string;
  vehicle_model: string;
  document_type: VehicleDocumentType;
  document_number: string;
  expiry_date: string;
  days_until_expiry: number;
  status: VehicleDocumentStatus;
}

export interface IncidentStats {
  total: number;
  resolved: number;
  pending: number;
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
}
