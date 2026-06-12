/**
 * Resolves a URL from an env var that may be absolute (http://, ws://) or
 * relative (/path). Relative values are anchored to the current page origin.
 */
export const resolveApiUrl = (envValue: string | undefined, fallback: string): string => {
  const value = envValue || fallback;
  if (/^https?:\/\//i.test(value)) return value;
  return `${window.location.origin}${value.startsWith('/') ? value : `/${value}`}`;
};

export const resolveWsUrl = (envValue: string | undefined, fallback: string): string => {
  const value = envValue || fallback;
  if (/^wss?:\/\//i.test(value)) return value;
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${wsProtocol}//${window.location.host}${path}`;
};

/**
 * Returns the backend base URL without the trailing /api segment.
 * Used to build absolute URLs for media files served by the backend.
 */
export const getBackendBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || '/fleet-management/api';
  const resolved = /^https?:\/\//i.test(apiUrl)
    ? apiUrl
    : `${window.location.origin}${apiUrl.startsWith('/') ? apiUrl : `/${apiUrl}`}`;
  return resolved.replace(/\/api\/?$/, '');
};
