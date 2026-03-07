/**
 * Gestionnaire de session
 * - Timeout inactivité
 * - Refresh proactif du token
 */

import axios from 'axios';
import { shouldRefreshToken, isTokenExpired } from '@/utils/tokenUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Configuration
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const INACTIVITY_WARNING = 5 * 60 * 1000; // Avertissement 5 minutes avant
const TOKEN_REFRESH_INTERVAL = 60 * 1000; // Vérification toutes les minutes
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

type SessionCallback = () => void;
type WarningCallback = (remainingMs: number) => void;

class SessionManager {
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private lastActivity: number = Date.now();
  private isActive: boolean = false;
  private onLogout: SessionCallback | null = null;
  private onWarning: WarningCallback | null = null;
  private onSessionExtended: SessionCallback | null = null;

  /**
   * Démarre la gestion de session
   */
  start(callbacks: {
    onLogout: SessionCallback;
    onWarning?: WarningCallback;
    onSessionExtended?: SessionCallback;
  }): void {
    if (this.isActive) return;

    this.onLogout = callbacks.onLogout;
    this.onWarning = callbacks.onWarning || null;
    this.onSessionExtended = callbacks.onSessionExtended || null;
    this.isActive = true;
    this.lastActivity = Date.now();

    // Écouter les événements d'activité
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, this.handleActivity, { passive: true });
    });

    // Écouter la visibilité de la page
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Démarrer les timers
    this.resetInactivityTimer();
    this.startTokenRefreshCheck();

    console.log('[SessionManager] Session started');
  }

  /**
   * Arrête la gestion de session
   */
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;

    // Supprimer les écouteurs
    ACTIVITY_EVENTS.forEach((event) => {
      window.removeEventListener(event, this.handleActivity);
    });
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    // Nettoyer les timers
    this.clearTimers();

    console.log('[SessionManager] Session stopped');
  }

  /**
   * Gère l'activité utilisateur
   */
  private handleActivity = (): void => {
    const now = Date.now();

    // Throttle: ne réagir que si plus de 1 seconde depuis la dernière activité
    if (now - this.lastActivity < 1000) return;

    this.lastActivity = now;
    this.resetInactivityTimer();
  };

  /**
   * Gère le changement de visibilité de la page
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      // Vérifier si la session a expiré pendant l'absence
      const inactiveTime = Date.now() - this.lastActivity;

      if (inactiveTime >= INACTIVITY_TIMEOUT) {
        this.handleInactivityTimeout();
      } else {
        // Vérifier le token immédiatement
        this.checkAndRefreshToken();
        this.resetInactivityTimer();
      }
    }
  };

  /**
   * Réinitialise le timer d'inactivité
   */
  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Timer d'avertissement
    this.warningTimer = setTimeout(() => {
      if (this.onWarning) {
        this.onWarning(INACTIVITY_WARNING);
      }
    }, INACTIVITY_TIMEOUT - INACTIVITY_WARNING);

    // Timer de déconnexion
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, INACTIVITY_TIMEOUT);
  }

  /**
   * Démarre la vérification périodique du token
   */
  private startTokenRefreshCheck(): void {
    // Vérifier immédiatement
    this.checkAndRefreshToken();

    // Puis vérifier périodiquement
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, TOKEN_REFRESH_INTERVAL);
  }

  /**
   * Vérifie et rafraîchit le token si nécessaire
   */
  private async checkAndRefreshToken(): Promise<void> {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!accessToken || !refreshToken) return;

    // Si le token est expiré, déconnecter
    if (isTokenExpired(accessToken)) {
      console.log('[SessionManager] Token expired, logging out');
      this.handleInactivityTimeout();
      return;
    }

    // Si le token doit être rafraîchi (moins de 5 minutes)
    if (shouldRefreshToken(accessToken)) {
      try {
        console.log('[SessionManager] Proactive token refresh');
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        if (this.onSessionExtended) {
          this.onSessionExtended();
        }
      } catch (error) {
        console.error('[SessionManager] Token refresh failed:', error);
        this.handleInactivityTimeout();
      }
    }
  }

  /**
   * Gère le timeout d'inactivité
   */
  private handleInactivityTimeout(): void {
    console.log('[SessionManager] Inactivity timeout');
    this.stop();

    if (this.onLogout) {
      this.onLogout();
    }
  }

  /**
   * Nettoie tous les timers
   */
  private clearTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Étend manuellement la session (ex: après clic sur "Rester connecté")
   */
  extendSession(): void {
    this.lastActivity = Date.now();
    this.resetInactivityTimer();
    this.checkAndRefreshToken();
  }

  /**
   * Retourne le temps restant avant déconnexion
   */
  getRemainingTime(): number {
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, INACTIVITY_TIMEOUT - elapsed);
  }
}

// Export singleton
export const sessionManager = new SessionManager();
