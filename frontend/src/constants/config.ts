export const APP_CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:5011/api",
  MAP: {
    DEFAULT_CENTER: {
      lat: 10.7598,
      lng: 106.7042,
    },
    DEFAULT_ZOOM: 16,
  },
};

