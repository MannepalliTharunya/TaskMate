/**
 * Axios instance pre-configured for the TaskAI backend.
 *
 * Features:
 *  - Attaches JWT Bearer token to every request automatically.
 *  - Intercepts 401 responses and silently refreshes the access token
 *    using the stored refresh token before retrying the original request.
 *  - Redirects to /login and clears storage if refresh fails.
 *  - 30-second request timeout to prevent hanging requests.
 */

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/** Attach JWT access token to every outgoing request. */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** On 401, attempt a silent token refresh then retry the original request. */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');

      if (refresh) {
        try {
          const { data } = await axios.post(
            `${BASE_URL}/auth/refresh/`,
            { refresh },
            { timeout: 10000 },
          );
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          // Refresh failed — session is expired
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
