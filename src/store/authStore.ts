import { create } from 'zustand';
import axios from 'axios';
import type { User, Organization } from '@/types';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  lastActivity: number;
  login: (access: string, refresh: string, user?: User, organization?: Organization) => void;
  setUser: (user: User) => void;
  setOrganization: (organization: Organization) => void;
  updateLastActivity: () => void;
  logout: () => Promise<void>;
  logoutSilent: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Clés localStorage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  LAST_ACTIVITY: 'last_activity',
  USER: 'user_data',
  ORGANIZATION: 'organization_data',
};

// Charger les données depuis localStorage
const loadFromStorage = () => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
  const userData = localStorage.getItem(STORAGE_KEYS.USER);
  const orgData = localStorage.getItem(STORAGE_KEYS.ORGANIZATION);

  return {
    token,
    isAuthenticated: !!token,
    lastActivity: lastActivity ? parseInt(lastActivity, 10) : Date.now(),
    user: userData ? JSON.parse(userData) : null,
    organization: orgData ? JSON.parse(orgData) : null,
  };
};

const initialState = loadFromStorage();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialState.user,
  organization: initialState.organization,
  token: initialState.token,
  isAuthenticated: initialState.isAuthenticated,
  lastActivity: initialState.lastActivity,

  login: (access: string, refresh: string, user?: User, organization?: Organization) => {
    const now = Date.now();

    // Stocker les tokens
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());

    // Stocker les données utilisateur
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
    if (organization) {
      localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(organization));
    }

    set({
      token: access,
      isAuthenticated: true,
      user: user || null,
      organization: organization || null,
      lastActivity: now,
    });
  },

  setUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user });
  },

  setOrganization: (organization: Organization) => {
    localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(organization));
    set({ organization });
  },

  updateLastActivity: () => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, now.toString());
    set({ lastActivity: now });
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      // Appeler l'API de logout pour blacklister le token
      if (refreshToken && accessToken) {
        await axios.post(
          `${API_URL}/auth/logout/`,
          { refresh: refreshToken },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      }
    } catch (error) {
      // Ignorer les erreurs de logout (token peut être déjà expiré)
      console.warn('Erreur lors du logout API:', error);
    } finally {
      // Toujours supprimer les données locales
      get().logoutSilent();
    }
  },

  // Logout sans appel API (pour timeout inactivité)
  logoutSilent: () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    set({
      user: null,
      organization: null,
      token: null,
      isAuthenticated: false,
      lastActivity: 0,
    });
  },
}));
