import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      const res = await api.post('/auth/refresh', { refresh_token: refreshToken });

      const nextToken = res.data?.token;
      const nextRefreshToken = res.data?.refresh_token;

      if (nextToken) {
        localStorage.setItem('token', nextToken);
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
      }

      if (nextRefreshToken) {
        localStorage.setItem('refresh_token', nextRefreshToken);
      }

      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;