import { apiClient } from './client';
import type { User, Organization, ModuleCode } from '@/types';

interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Réponse de `/auth/login/`.
 * Le backend renvoie déjà l'utilisateur, son organisation (avec ses modules)
 * et la liste des modules à plat — inutile de rappeler `/auth/me/` ensuite.
 */
interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  organization: Organization | null;
  modules: ModuleCode[];
}

interface ProfileResponse {
  user: User;
  organization: Organization | null;
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
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

  // Login + validation du rôle (un seul appel : /auth/login/ renvoie tout)
  loginWithProfile: async (credentials: LoginCredentials): Promise<{
    access: string;
    refresh: string;
    user: User;
    organization: Organization | null;
  }> => {
    // Étape 1 : login — renvoie tokens, utilisateur, organisation et modules
    const { data } = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    const { access, refresh, user, organization, modules } = data;

    // Étape 2 : valider le rôle (seuls admin et superviseur accèdent au web)
    if (user.role === 'driver') {
      // Le chauffeur n'a pas accès au web : on révoque immédiatement le token
      try {
        await apiClient.post(
          '/auth/logout/',
          { refresh },
          { headers: { Authorization: `Bearer ${access}` } }
        );
      } catch {
        // Ignorer les erreurs de logout
      }
      throw new Error('ROLE_NOT_ALLOWED');
    }

    // L'organisation porte ses propres modules ; on retombe sur la liste à plat
    // si jamais le backend ne les imbrique pas (source d'autorité = useModules).
    const resolvedOrganization: Organization | null = organization
      ? { ...organization, modules: organization.modules ?? modules }
      : user.organization || null;

    return {
      access,
      refresh,
      user,
      organization: resolvedOrganization,
    };
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await apiClient.put<User>('/auth/me/', data);
    return response.data;
  },

  updateProfileWithPhoto: async (data: FormData) => {
    const response = await apiClient.patch<User>('/auth/me/', data);
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
    const response = await apiClient.post('/auth/signup/initiate/', data);
    return response.data;
  },

  // Signup - Verify token
  signupVerifyToken: async (token: string) => {
    const response = await apiClient.post('/auth/signup/verify-token/', { token });
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
    const response = await apiClient.post('/auth/signup/complete/', data);
    return response.data;
  },
};
