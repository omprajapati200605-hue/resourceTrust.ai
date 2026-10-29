
import { API_BASE, request, tokenStore, ApiError } from './client';

const qs = (params = {}) => {
  const s = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      s.set(k, String(v));
    }
  });

  const out = s.toString();
  return out ? `?${out}` : '';
};

// GET /health returns database connection status.
export async function getHealth(signal) {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      cache: 'no-store',
      signal,
    });

    const data = await res.json().catch(() => ({}));

    return {
      reachable: true,
      database:
        data?.database === 'connected'
          ? 'connected'
          : 'unavailable',
    };
  } catch (err) {
    if (err?.name === 'AbortError') throw err;

    return {
      reachable: false,
      database: 'unknown',
    };
  }
}

// Authentication
export const register = (p) =>
  request('/v1/auth/register', {
    method: 'POST',
    body: p,
    auth: false,
  });

export async function login(email, password) {
  const data = await request('/v1/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });

  tokenStore.set(data.access_token);
  return data;
}

export const getMe = (signal) =>
  request('/v1/auth/me', { signal });

// Resources
export const listResources = (params = {}, signal) =>
  request(`/v1/resources${qs(params)}`, { signal });

export const getResource = (id, signal) =>
  request(`/v1/resources/${id}`, { signal });

export const createResource = (payload) =>
  request('/v1/resources', {
    method: 'POST',
    body: payload,
  });

export const setResourceStatus = (id, status) =>
  request(`/v1/resources/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });

// Bookings
export const createBooking = (payload) =>
  request('/v1/bookings', {
    method: 'POST',
    body: payload,
  });

export const myBookings = (signal) =>
  request('/v1/bookings/me', { signal });

export const resourceBookings = (id, signal) =>
  request(`/v1/resources/${id}/bookings`, { signal });

export const decideBooking = (id, decision, note) =>
  request(`/v1/bookings/${id}/decision`, {
    method: 'PATCH',
    body: {
      decision,
      note: note || null,
    },
  });

export const cancelBooking = (id) =>
  request(`/v1/bookings/${id}/cancel`, {
    method: 'POST',
  });

// Eligibility
export const submitEligibility = (payload) =>
  request('/v1/eligibility', {
    method: 'POST',
    body: payload,
  });

export const myEligibility = (signal) =>
  request('/v1/eligibility/me', { signal });

// Notifications
export const listNotifications = (signal) =>
  request('/v1/notifications', { signal });

export const markNotificationRead = (id) =>
  request(`/v1/notifications/${id}/read`, {
    method: 'POST',
  });

export { API_BASE, ApiError, tokenStore };
