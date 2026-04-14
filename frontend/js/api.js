/**
 * api.js — Centralised API client with JWT auth headers
 * All fetch calls go through apiFetch() to ensure consistent auth/error handling.
 */

// Automatically switch API base based on hostname. For production, update the production URL.
export const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:8000' 
  : 'https://api.your-production-domain.com'; // TODO: Update this when deploying to the cloud

/**
 * Core fetch wrapper. Attaches Bearer token automatically.
 * On 401, clears auth and redirects to login.
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.clear();
    window.location.href = 'login.html';
    throw new Error('Unauthorized — redirecting to login');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    let errorMsg = err.detail || `HTTP ${response.status}`;
    if (Array.isArray(err.detail)) {
      // Handle Pydantic validation errors
      errorMsg = err.detail.map(d => {
        const field = d.loc && d.loc.length > 1 ? d.loc[d.loc.length - 1] : '';
        return field ? `${field}: ${d.msg}` : d.msg;
      }).join('; ');
    } else if (typeof err.detail === 'object') {
      errorMsg = JSON.stringify(err.detail);
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) return null;
  return response.json();
}

/** Convenience helpers */
export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
};

/** Get saved auth info */
export function getAuth() {
  return {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    userId: localStorage.getItem('userId'),
    username: localStorage.getItem('username'),
  };
}

/** Save auth info after login/register */
export function saveAuth(data) {
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('role', data.role);
  localStorage.setItem('userId', data.user_id);
  localStorage.setItem('username', data.username);
}

/** Clear auth info (logout) */
export function clearAuth() {
  localStorage.clear();
}

/** Require auth — redirect to login if not logged in */
export function requireAuth(requiredRole = null) {
  const { token, role } = getAuth();
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  if (requiredRole && role !== requiredRole && role !== 'admin') {
    window.location.href = 'map.html';
    return false;
  }
  return true;
}
