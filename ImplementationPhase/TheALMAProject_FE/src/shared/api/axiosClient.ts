import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7106/api",
  headers: {
    Accept: "application/json",
  },
});

function readServerMessage(data: unknown): string | null {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (typeof record.title === "string") return record.title;

  return null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return readServerMessage(error.response?.data) ?? error.message ?? fallback;
  }

  if (error instanceof Error) return error.message;

  return fallback;
}

export function resolveApiAssetUrl(url: string | null) {
  if (!url) return null;

  return new URL(url, axiosClient.defaults.baseURL).href;
}

// Interceptor: Tự động gắn Token
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Xử lý lỗi Response
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token không hợp lệ hoặc hết hạn → xóa session và redirect về login
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userFullName');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
