const API_BASE_STORAGE_KEY = "finpilot_api_base";
const DEFAULT_API_BASE = "https://finpilot-api-iz93.onrender.com/api";

export function getApiBase() {
  return (
    localStorage.getItem(API_BASE_STORAGE_KEY) ||
    window.FINPILOT_CONFIG?.API_BASE ||
    import.meta.env.VITE_API_BASE ||
    DEFAULT_API_BASE
  ).replace(/\/$/, "");
}
