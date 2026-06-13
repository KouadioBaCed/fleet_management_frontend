import {
  LayoutDashboard,
  Car,
  Users,
  MapPin,
  Radio,
  AlertTriangle,
  Wrench,
  Fuel,
  PieChart,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import type { ModuleCode } from '@/types';

/**
 * Registre frontend des modules.
 *
 * Source de vérité unique côté web pour : sidebar, routes, titres de page.
 * Pour ajouter un module : ajoutez son code dans `ModuleCode` (src/types),
 * une entrée ici, et la page/route correspondante.
 *
 * L'accès réel est piloté par le backend via `/auth/me/` (champ `modules`).
 * Ce registre ne fait que décrire *comment* présenter chaque module.
 */
export interface ModuleConfig {
  code: ModuleCode;
  /** Chemin de la route (react-router). */
  path: string;
  icon: LucideIcon;
  /** Clé i18n du libellé (existe déjà dans les locales : `nav.*`). */
  labelKey: string;
  /** Ordre d'affichage dans la sidebar. */
  order: number;
}

export const MODULES: ModuleConfig[] = [
  { code: 'dashboard', path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard', order: 10 },
  { code: 'vehicles', path: '/vehicles', icon: Car, labelKey: 'nav.vehicles', order: 30 },
  { code: 'drivers', path: '/drivers', icon: Users, labelKey: 'nav.drivers', order: 40 },
  { code: 'missions', path: '/missions', icon: MapPin, labelKey: 'nav.missions', order: 50 },
  { code: 'tracking', path: '/tracking', icon: Radio, labelKey: 'nav.tracking', order: 60 },
  { code: 'incidents', path: '/incidents', icon: AlertTriangle, labelKey: 'nav.incidents', order: 20 },
  { code: 'maintenance', path: '/maintenance', icon: Wrench, labelKey: 'nav.maintenance', order: 70 },
  { code: 'fuel', path: '/fuel', icon: Fuel, labelKey: 'nav.fuel', order: 80 },
  { code: 'analytics', path: '/analytics', icon: PieChart, labelKey: 'nav.analytics', order: 90 },
  { code: 'reports', path: '/reports', icon: BarChart3, labelKey: 'nav.reports', order: 100 },
];

/** Tous les codes de modules connus côté frontend. */
export const ALL_MODULE_CODES: ModuleCode[] = MODULES.map((m) => m.code);

/**
 * Routes toujours accessibles, quelle que soit la configuration des modules
 * (profil, paramètres). Elles ne sont protégées que par l'authentification.
 */
export const ALWAYS_AVAILABLE_PATHS = ['/settings', '/profile'];

const MODULES_BY_CODE: Record<ModuleCode, ModuleConfig> = MODULES.reduce(
  (acc, m) => {
    acc[m.code] = m;
    return acc;
  },
  {} as Record<ModuleCode, ModuleConfig>
);

export function getModuleByCode(code: ModuleCode): ModuleConfig | undefined {
  return MODULES_BY_CODE[code];
}

export function getModuleByPath(path: string): ModuleConfig | undefined {
  return MODULES.find((m) => m.path === path);
}

/**
 * Calcule la route d'atterrissage par défaut selon les modules autorisés.
 *
 * - Si le dashboard est disponible -> `/` (comportement classique).
 * - Sinon -> la 1ʳᵉ route de module disponible (ex: une organisation
 *   "incidents uniquement" atterrit sur `/incidents`).
 * - Aucun module -> `/profile` (fallback sûr, jamais d'écran vide).
 */
export function getDefaultPath(enabledModules: ModuleCode[]): string {
  if (enabledModules.includes('dashboard')) {
    return '/';
  }
  const firstAvailable = MODULES
    .filter((m) => enabledModules.includes(m.code))
    .sort((a, b) => a.order - b.order)[0];

  return firstAvailable ? firstAvailable.path : '/profile';
}
