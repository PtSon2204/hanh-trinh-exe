import axios from "axios";

const axiosClient = axios.create({
    baseURL: "https://hanh-trinh-exe.onrender.com/api",
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

  if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return new URL(cleanUrl, axiosClient.defaults.baseURL).href;
  }

  // If it's a frontend public asset path or backend seed path starting with /images
  if (url.startsWith("/images/") || url.startsWith("images/")) {
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;

    if (cleanUrl.startsWith("/images/icons/")) {
      return new URL(cleanUrl, axiosClient.defaults.baseURL).href;
    }

    // Map backend seed university logos to actual high-quality frontend public files
    if (cleanUrl.startsWith("/images/logos/")) {
      const fileName = cleanUrl.split("/").pop();
      if (fileName) {
        const universityLogoMap: Record<string, string> = {
          "fpt-logo.png": "/images/Logo_Cac_Truong/logo_Fpt.webp",
          "vnu-logo.png": "/images/Logo_Cac_Truong/logo_VNU.png",
          "aof-logo.png": "/images/Logo_Cac_Truong/logo_HVTC.webp",
          "neu-logo.png": "/images/Logo_Cac_Truong/logo_NEU.webp",
          "hust-logo.png": "/images/Logo_Cac_Truong/logo_bk.webp",
          "ftu-logo.png": "/images/Logo_Cac_Truong/logo_NH.webp",
          "hlu-logo.png": "/images/Logo_Cac_Truong/logo_TL.webp",
          "tmu-logo.png": "/images/Logo_Cac_Truong/logo_ThangLong.webp",
        };
        const mapped = universityLogoMap[fileName];
        if (mapped) return mapped;
      }
    }
    return cleanUrl;
  }

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
