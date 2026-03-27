const PROD_API_BASE = "https://hack4delhi.onrender.com";
const LOCAL_API_BASE = "http://localhost:5000";

const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const isProd = import.meta.env.PROD;

export const API_BASE_URL = isProd
  ? (envApiUrl && !envApiUrl.includes("localhost") ? envApiUrl : PROD_API_BASE)
  : (envApiUrl || LOCAL_API_BASE);

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
