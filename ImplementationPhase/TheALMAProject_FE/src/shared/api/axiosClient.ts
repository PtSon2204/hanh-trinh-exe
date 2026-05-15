import axios from 'axios';

const axiosClient = axios.create({
  // Đã sửa lại thành 7106 cho khớp với Swagger của bạn
  baseURL: 'https://localhost:7106/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); 
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