// Single place for HTTP access. Base URL comes from VITE_API_BASE_URL (VITE_API_URL kept as a fallback

 // Single place for HTTP access.
 // Production uses Vercel's /api route; local development uses localhost.
export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:8000')
).replace(/\/$/, '');

const TOKEN_KEY = 'rt_token';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      localStorage.setItem(TOKEN_KEY, value);
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export class ApiError extends Error {
  constructor(message, status = 0, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.isNetwork = status === 0;
  }
}

function describe(detail, status) {
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map(
        (d) =>
          `${(d.loc || [])
            .filter((p) => p !== 'body')
            .join('.')}: ${d.msg}`
      )
      .join('; ');
  }

  return `Request failed (${status})`;
}

export async function request(
  path,
  { method = 'GET', body, signal, auth = true } = {}
) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = auth ? tokenStore.get() : null;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;

  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;

    throw new ApiError(
      `Cannot reach the API at ${API_BASE}. Check that the backend is running and CORS allows this origin.`
    );
  }

  const raw = await res.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event('rt:unauthorized'));
    }

    throw new ApiError(
      describe(data?.detail, res.status),
      res.status,
      data?.detail ?? null
    );
  }

  return data;
}
