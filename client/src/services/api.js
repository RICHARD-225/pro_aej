// Point unique pour les appels HTTP : le jeton n'est jamais dupliqué dans les services métier.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const getAccessToken = () => null;
export const setAccessToken = () => {};
export const clearAccessToken = () => {};

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
        ...options.headers
      }
    });
  } catch (networkError) {
    throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
  }

  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) window.dispatchEvent(new CustomEvent('aej:session-expired'));
  if (!response.ok || payload.success === false) {
    if (response.status === 429) {
      throw new Error(payload.message || 'Trop de tentatives de connexion (5 maximum). Veuillez patienter 15 minutes avant de réessayer.');
    }
    throw new Error(payload.message || `La requête a échoué (code ${response.status}).`);
  }
  return payload;
}
