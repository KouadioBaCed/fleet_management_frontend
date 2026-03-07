/**
 * Utilitaires pour la gestion des tokens JWT
 */

interface TokenPayload {
  exp: number;
  iat: number;
  user_id: number;
  [key: string]: unknown;
}

/**
 * Decode un token JWT sans vérification de signature
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Vérifie si un token est expiré
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;

  // Ajouter une marge de 30 secondes
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now + 30;
}

/**
 * Récupère le temps restant avant expiration en secondes
 */
export function getTokenTimeRemaining(token: string): number {
  const payload = decodeToken(token);
  if (!payload) return 0;

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

/**
 * Vérifie si le token doit être rafraîchi (moins de 5 minutes restantes)
 */
export function shouldRefreshToken(token: string, thresholdSeconds = 300): boolean {
  const remaining = getTokenTimeRemaining(token);
  return remaining > 0 && remaining < thresholdSeconds;
}
