import { apiClient } from './client';

export type DistanceUnit = 'km' | 'miles';
export type FuelUnit = 'liters' | 'gallons';
export type Currency = 'XOF';
export type Language = 'fr' | 'en';
export type Theme = 'light' | 'dark' | 'auto';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export interface UserPreferences {
  // Units
  distance_unit: DistanceUnit;
  fuel_unit: FuelUnit;
  currency: Currency;

  // Language & Region
  language: Language;
  timezone: string;
  date_format: DateFormat;

  // Notifications
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  maintenance_alerts: boolean;
  incident_alerts: boolean;
  fuel_alerts: boolean;
  report_reminders: boolean;
  daily_summary: boolean;
  weekly_summary: boolean;

  // Appearance
  theme: Theme;
  primary_color: string;
  secondary_color: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface UpdatePreferencesData {
  distance_unit?: DistanceUnit;
  fuel_unit?: FuelUnit;
  currency?: Currency;
  language?: Language;
  timezone?: string;
  date_format?: DateFormat;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  push_notifications?: boolean;
  maintenance_alerts?: boolean;
  incident_alerts?: boolean;
  fuel_alerts?: boolean;
  report_reminders?: boolean;
  daily_summary?: boolean;
  weekly_summary?: boolean;
  theme?: Theme;
  primary_color?: string;
  secondary_color?: string;
}

export const settingsApi = {
  getPreferences: async (): Promise<UserPreferences> => {
    const response = await apiClient.get<UserPreferences>('/auth/preferences/');
    return response.data;
  },

  updatePreferences: async (data: UpdatePreferencesData): Promise<{ message: string; preferences: UserPreferences }> => {
    const response = await apiClient.patch<{ message: string; preferences: UserPreferences }>('/auth/preferences/', data);
    return response.data;
  },
};

// Unit conversion helpers
export const convertDistance = (value: number, from: DistanceUnit, to: DistanceUnit): number => {
  if (from === to) return value;
  if (from === 'km' && to === 'miles') return value * 0.621371;
  if (from === 'miles' && to === 'km') return value * 1.60934;
  return value;
};

export const convertFuel = (value: number, from: FuelUnit, to: FuelUnit): number => {
  if (from === to) return value;
  if (from === 'liters' && to === 'gallons') return value * 0.264172;
  if (from === 'gallons' && to === 'liters') return value * 3.78541;
  return value;
};

export const formatDistance = (value: number, unit: DistanceUnit): string => {
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${unit === 'km' ? 'km' : 'mi'}`;
};

export const formatFuel = (value: number, unit: FuelUnit): string => {
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${unit === 'liters' ? 'L' : 'gal'}`;
};

export const getDistanceLabel = (unit: DistanceUnit): string => {
  return unit === 'km' ? 'km' : 'miles';
};

export const getFuelLabel = (unit: FuelUnit): string => {
  return unit === 'liters' ? 'L' : 'gal';
};

export const getCurrencySymbol = (currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    XOF: 'FCFA',
  };
  return symbols[currency] || currency;
};

export const formatCurrency = (value: number, currency: Currency): string => {
  const symbol = getCurrencySymbol(currency);
  const formatted = value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${formatted} ${symbol}`;
};
