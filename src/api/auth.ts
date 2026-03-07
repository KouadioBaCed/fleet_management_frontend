import { apiClient } from './client';
import axios from 'axios';
import type { User, Organization } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
}

interface ProfileResponse {
  user: User;
  organization: Organization | null;
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await axios.post<LoginResponse>(
      `${API_URL}/auth/login/`,
      credentials
    );
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<User>('/auth/me/');
    const user = response.data;
    return {
      user,
      organization: user.organization || null,
    };
  },

  // Login with profile fetch - validates role
  loginWithProfile: async (credentials: LoginCredentials): Promise<{
    access: string;
    refresh: string;
    user: User;
    organization: Organization | null;
  }> => {
    // Step 1: Login to get tokens
    const loginResponse = await axios.post<LoginResponse>(
      `${API_URL}/auth/login/`,
      credentials
    );
    const { access, refresh } = loginResponse.data;

    // Step 2: Fetch profile with the new token
    const profileResponse = await axios.get<User>(
      `${API_URL}/auth/me/`,
      { headers: { Authorization: `Bearer ${access}` } }
    );
    const user = profileResponse.data;

    // Step 3: Validate role (only admin and supervisor can access web)
    if (user.role === 'driver') {
      // Logout the token since driver can't access web
      try {
        await axios.post(
          `${API_URL}/auth/logout/`,
          { refresh },
          { headers: { Authorization: `Bearer ${access}` } }
        );
      } catch {
        // Ignore logout errors
      }
      throw new Error('ROLE_NOT_ALLOWED');
    }

    return {
      access,
      refresh,
      user,
      organization: user.organization || null,
    };
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await apiClient.put<User>('/auth/me/', data);
    return response.data;
  },

  updateProfileWithPhoto: async (data: FormData) => {
    const response = await apiClient.patch<User>('/auth/me/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  changePassword: async (data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }) => {
    const response = await apiClient.post('/auth/change-password/', data);
    return response.data;
  },

  deleteAccount: async (password: string) => {
    const response = await apiClient.post('/auth/delete-account/', { password });
    return response.data;
  },

  // Signup - Initiate (send verification email)
  signupInitiate: async (data: {
    email: string;
    first_name: string;
    last_name: string;
    organization_name: string;
  }) => {
    const response = await axios.post(`${API_URL}/auth/signup/initiate/`, data);
    return response.data;
  },

  // Signup - Verify token
  signupVerifyToken: async (token: string) => {
    const response = await axios.post(`${API_URL}/auth/signup/verify-token/`, { token });
    return response.data;
  },

  // Signup - Complete registration
  signupComplete: async (data: {
    token: string;
    username: string;
    password: string;
    password_confirm: string;
    phone_number?: string;
  }) => {
    const response = await axios.post(`${API_URL}/auth/signup/complete/`, data);
    return response.data;
  },
};
