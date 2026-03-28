const PROD_API_BASE = "https://credchain-m0dz.onrender.com";
const LOCAL_API_BASE = "http://localhost:5000";

const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const isProd = import.meta.env.PROD;

// Helper to determine base URL
const getBaseUrl = () => {
  // If explicitly set in environment, use it
  if (envApiUrl && !envApiUrl.includes("localhost")) return envApiUrl;

  // If in production mode, use the hardcoded prod endpoint or current window origin if they match
  if (isProd) {
    return PROD_API_BASE;
  }

  return LOCAL_API_BASE;
};

export const API_BASE_URL = getBaseUrl();

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
