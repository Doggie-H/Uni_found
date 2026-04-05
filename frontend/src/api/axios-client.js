import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor cho Request để tính năng Login / Auth (Nếu có)
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("unifound_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("unifound_token");
      localStorage.removeItem("unifound_user");
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
