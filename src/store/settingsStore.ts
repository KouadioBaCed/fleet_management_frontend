import { create } from 'zustand';
import {
  settingsApi,
  type UserPreferences,
  type DistanceUnit,
  type FuelUnit,
  type Currency,
  type Language,
  type Theme,
  type DateFormat,
  type UpdatePreferencesData,
} from '@/api/settings';

interface SettingsState {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: UpdatePreferencesData) => Promise<void>;
  setPreferences: (preferences: UserPreferences) => void;

  // Quick accessors
  getDistanceUnit: () => DistanceUnit;
  getFuelUnit: () => FuelUnit;
  getCurrency: () => Currency;
  getLanguage: () => Language;
  getTheme: () => Theme;
}

// Storage key
const STORAGE_KEY = 'user_preferences';

// Load from localStorage for offline access
const loadFromStorage = (): UserPreferences | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

// Default preferences
const defaultPreferences: UserPreferences = {
  distance_unit: 'km',
  fuel_unit: 'liters',
  currency: 'XOF',
  language: 'fr',
  timezone: 'Africa/Abidjan',
  date_format: 'DD/MM/YYYY',
  email_notifications: true,
  sms_notifications: false,
  push_notifications: true,
  maintenance_alerts: true,
  incident_alerts: true,
  fuel_alerts: true,
  report_reminders: true,
  daily_summary: false,
  weekly_summary: true,
  theme: 'light',
  primary_color: '#6A8A82',
  secondary_color: '#B87333',
  created_at: '',
  updated_at: '',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  preferences: loadFromStorage(),
  isLoading: false,
  error: null,

  fetchPreferences: async () => {
    set({ isLoading: true, error: null });
    try {
      const preferences = await settingsApi.getPreferences();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      set({ preferences, isLoading: false });
    } catch (err: any) {
      console.error('Error fetching preferences:', err);
      // Use cached preferences if available, otherwise use defaults
      const cached = loadFromStorage();
      set({
        preferences: cached || defaultPreferences,
        isLoading: false,
        error: err.response?.data?.detail || 'Erreur lors du chargement des préférences',
      });
    }
  },

  updatePreferences: async (data: UpdatePreferencesData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await settingsApi.updatePreferences(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.preferences));
      set({ preferences: response.preferences, isLoading: false });
    } catch (err: any) {
      console.error('Error updating preferences:', err);
      set({
        isLoading: false,
        error: err.response?.data?.detail || 'Erreur lors de la mise à jour des préférences',
      });
      throw err;
    }
  },

  setPreferences: (preferences: UserPreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    set({ preferences });
  },

  // Quick accessors with fallback to defaults
  getDistanceUnit: () => get().preferences?.distance_unit || 'km',
  getFuelUnit: () => get().preferences?.fuel_unit || 'liters',
  getCurrency: () => get().preferences?.currency || 'XOF',
  getLanguage: () => get().preferences?.language || 'fr',
  getTheme: () => get().preferences?.theme || 'light',
}));

// Export helper hooks for common use cases
export const useDistanceUnit = () => useSettingsStore((state) => state.preferences?.distance_unit || 'km');
export const useFuelUnit = () => useSettingsStore((state) => state.preferences?.fuel_unit || 'liters');
export const useCurrency = () => useSettingsStore((state) => state.preferences?.currency || 'XOF');
export const useLanguage = () => useSettingsStore((state) => state.preferences?.language || 'fr');
export const useTheme = () => useSettingsStore((state) => state.preferences?.theme || 'light');
export const useNotificationSettings = () => useSettingsStore((state) => ({
  email: state.preferences?.email_notifications ?? true,
  sms: state.preferences?.sms_notifications ?? false,
  push: state.preferences?.push_notifications ?? true,
  maintenance: state.preferences?.maintenance_alerts ?? true,
  incidents: state.preferences?.incident_alerts ?? true,
  fuel: state.preferences?.fuel_alerts ?? true,
  reports: state.preferences?.report_reminders ?? true,
  dailySummary: state.preferences?.daily_summary ?? false,
  weeklySummary: state.preferences?.weekly_summary ?? true,
}));

// Color hooks
export const usePrimaryColor = () => useSettingsStore((state) => state.preferences?.primary_color || '#6A8A82');
export const useSecondaryColor = () => useSettingsStore((state) => state.preferences?.secondary_color || '#B87333');
export const useColors = () => useSettingsStore((state) => ({
  primary: state.preferences?.primary_color || '#6A8A82',
  secondary: state.preferences?.secondary_color || '#B87333',
}));
