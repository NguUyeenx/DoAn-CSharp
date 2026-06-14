export const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN || "";
export const API_BASE_URL = "/api";
export const DEFAULT_CENTER: [number, number] = [106.6825, 10.7537]; // Vinh Khanh area
export const DEFAULT_ZOOM = 15;
export const SUPPORTED_LANGUAGES = ["en", "vi"] as const;
export const DEFAULT_LANGUAGE = "en";
export const DEBOUNCE_MS = 300;
