import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG, STORAGE_KEYS } from './config';
import { generateIdempotencyKey, IDEMPOTENCY_HEADER } from './idempotency';

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Attach Bearer token + Idempotency-Key for mutating requests
api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Auto-attach Idempotency-Key to mutating verbs (backend dedupes via DB table).
    // Caller can override by setting the header explicitly on the request config.
    const method = (config.method ?? 'get').toLowerCase();
    if (method === 'post' || method === 'put' || method === 'patch' || method === 'delete') {
      const existing =
        config.headers[IDEMPOTENCY_HEADER] ?? config.headers[IDEMPOTENCY_HEADER.toLowerCase()];
      if (!existing) {
        config.headers[IDEMPOTENCY_HEADER] = generateIdempotencyKey();
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isLoginRequest = originalRequest?.url?.includes('/auth/login');

    // If 401 (Unauthorized), clear auth and redirect to login — but not for the login request itself (avoid double handling)
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;

      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        // Clear the middleware session marker so the next navigation is
        // gated correctly. Inline because importing from sessionMarker here
        // would create a tight cycle on auth flows.
        document.cookie = 'puretask_session=; Path=/; Max-Age=0; SameSite=Lax';
        if (!window.location.pathname.startsWith('/auth/login')) {
          const returnTo = window.location.pathname + window.location.search;
          window.location.href = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
        }
      }
    }

    // Log errors in development — skip login request so the toast is the only feedback (avoids duplicate "API Error" overlay)
    if (process.env.NODE_ENV === 'development' && !isLoginRequest) {
      console.warn('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const apiClient = {
  // GET request
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    api.get<T>(url, config).then(res => res.data),

  // POST request
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config).then(res => res.data),

  // PUT request
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.put<T>(url, data, config).then(res => res.data),

  // PATCH request
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.patch<T>(url, data, config).then(res => res.data),

  // DELETE request
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config).then(res => res.data),
};

export default api;

