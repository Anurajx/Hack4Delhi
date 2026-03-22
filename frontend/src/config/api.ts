const PROD_API_BASE = "https://hack4delhi.onrender.com";
const LOCAL_API_BASE = "http://localhost:5000";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? PROD_API_BASE : LOCAL_API_BASE);

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
