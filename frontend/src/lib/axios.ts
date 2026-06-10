import axios from "axios";
import { APP_CONFIG } from "@/constants/config";

export const apiClient = axios.create({
  baseURL: APP_CONFIG.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optionally add interceptors for auth tokens here
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global API errors (e.g., 401 Unauthorized redirect to login)
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      // Optional: window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

