import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Configuration de base d'axios
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gestion des requêtes concurrentes pendant le refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Intercepteur pour ajouter le token JWT à chaque requête
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Si les données sont de type FormData, supprimer le Content-Type
    // pour laisser le navigateur définir le bon boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Intercepteur pour gérer le refresh automatique du token
 *
 * Workflow:
 * 1. Détection token expiré (erreur 401)
 * 2. Appel API /auth/refresh/ avec le refresh_token
 * 3. Mise à jour du token local (localStorage)
 * 4. Retry de la requête originale avec le nouveau token
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si l'erreur n'est pas 401 ou si c'est déjà un retry, rejeter
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si on est déjà en train de refresh, mettre la requête en file d'attente
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject: (err: AxiosError) => {
            reject(err);
          },
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Appel API refresh
      const response = await axios.post(`${API_URL}/auth/refresh/`, {
        refresh: refreshToken,
      });

      const { access } = response.data;

      // Mise à jour du token local
      localStorage.setItem('access_token', access);

      // Traiter les requêtes en attente
      processQueue(null, access);

      // Retry de la requête originale
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Si le refresh échoue, déconnecter l'utilisateur
      processQueue(refreshError as AxiosError, null);

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      // Redirection vers login
      window.location.href = '/login';

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
