import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/lib/env";
import { useAuthStore } from "@/store/authStore";

export const apiClient = axios.create({ baseURL: API_BASE_URL });

// Attach the current access token to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Transparent access-token refresh: on a 401, try /auth/refresh/ once,
// retry the original request, and only log the user out if the refresh
// itself fails. This means components never have to think about token
// expiry — a query just "works" across the boundary.
let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/auth/")) {
      originalRequest._retry = true;
      const { refreshToken, setAccessToken, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh/`, { refresh: refreshToken })
            .then((res) => {
              setAccessToken(res.data.access);
              return res.data.access as string;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/** Normalizes DRF's {detail, errors} shape into a single readable string for toasts. */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string; errors?: Record<string, string[]> };
    if (data?.errors && Object.keys(data.errors).length > 0) {
      const first = Object.values(data.errors)[0];
      return Array.isArray(first) ? first[0] : String(first);
    }
    if (data?.detail) return data.detail;
    if (error.message === "Network Error") return "Can't reach the server. Check your connection.";
  }
  return "Something went wrong. Please try again.";
}
