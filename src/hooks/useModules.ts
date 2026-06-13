import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ALL_MODULE_CODES } from '@/config/modules';
import type { ModuleCode } from '@/types';

/**
 * Retourne la liste des modules autorisés pour l'organisation connectée.
 *
 * Rétro-compatibilité : si l'organisation n'expose pas (encore) de modules
 * — par ex. données en cache antérieures à la fonctionnalité — on considère
 * que **tous** les modules sont actifs, afin de ne jamais verrouiller un
 * utilisateur par accident. Le backend reste la source d'autorité (403).
 */
export function useModules(): ModuleCode[] {
  const organization = useAuthStore((s) => s.organization);

  return useMemo(() => {
    const modules = organization?.modules;
    if (Array.isArray(modules)) {
      return modules;
    }
    return ALL_MODULE_CODES;
  }, [organization]);
}

/** Indique si l'organisation a accès à un module donné. */
export function useHasModule(code: ModuleCode): boolean {
  const modules = useModules();
  return modules.includes(code);
}
