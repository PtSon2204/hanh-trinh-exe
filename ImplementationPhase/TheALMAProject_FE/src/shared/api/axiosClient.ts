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

export default axiosClient;