import axios, { isAxiosError } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

function isPublicAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  const u = url.startsWith("http") ? new URL(url).pathname : url;
  return (
    u.includes("/auth/otp/request") ||
    u.includes("/auth/admin/otp/login") ||
    u.includes("/auth/admin/otp/signup") ||
    u.includes("/auth/superadmin/bootstrap-available") ||
    u.includes("/auth/superadmin/otp/signup") ||
    u.includes("/auth/customer/otp/login") ||
    u.includes("/auth/customer/otp/signup")
  );
}

// Request interceptor: add token to headers (not on unauthenticated auth calls)
api.interceptors.request.use(
  (config) => {
    if (isPublicAuthPath(config.url)) {
      const h = config.headers;
      if (h && typeof (h as { delete?: (k: string) => void }).delete === "function") {
        (h as { delete: (k: string) => void }).delete("Authorization");
      } else {
        delete (config.headers as Record<string, unknown>).Authorization;
      }
      return config;
    }
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = String(error.config?.url ?? "");
      const isAuthHandshakeFailure =
        url.includes("/auth/admin/otp/login") ||
        url.includes("/auth/admin/otp/signup") ||
        url.includes("/auth/otp/request") ||
        url.includes("/auth/customer/otp/login") ||
        url.includes("/auth/customer/otp/signup") ||
        url.includes("/auth/superadmin/otp/signup");

      if (!isAuthHandshakeFailure) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userPermissions');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { isAxiosError };
export default api;
