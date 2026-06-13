import { Navigate } from 'react-router-dom';
import type { JSX } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useModules } from '@/hooks/useModules';
import { getDefaultPath } from '@/config/modules';
import type { ModuleCode } from '@/types';

/**
 * Garde d'authentification simple : redirige vers /login si non connecté.
 * Utilisée pour les routes toujours disponibles (profil, paramètres).
 */
export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * Redirige les utilisateurs déjà connectés loin des pages publiques.
 */
export function PublicRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const modules = useModules();
  return isAuthenticated ? <Navigate to={getDefaultPath(modules)} replace /> : children;
}

/**
 * Garde de module : exige l'authentification ET que l'organisation possède
 * le module requis. Sinon, redirige vers la route d'atterrissage par défaut
 * (ex: une organisation "incidents uniquement" est renvoyée vers /incidents).
 *
 * NB : c'est une protection d'UX. La sécurité réelle est garantie côté
 * backend (HTTP 403 via la permission `HasOrganizationModule`).
 */
export function ModuleProtectedRoute({
  module,
  children,
}: {
  module: ModuleCode;
  children: JSX.Element;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const modules = useModules();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!modules.includes(module)) {
    return <Navigate to={getDefaultPath(modules)} replace />;
  }
  return children;
}

/**
 * Redirige vers la route d'atterrissage par défaut selon les modules
 * autorisés. Utilisée pour la route attrape-tout (`*`).
 */
export function DefaultRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const modules = useModules();
  return <Navigate to={isAuthenticated ? getDefaultPath(modules) : '/login'} replace />;
}
