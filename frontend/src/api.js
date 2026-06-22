import axios from "axios";

const api = axios.create({
  baseURL: "https://url-shortener-backend-9drd.onrender.com/api",
});

// Har request mein token automatically attach hoga
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const shortenUrl = (originalUrl, customAlias) =>
  api.post("/shorten", { originalUrl, customAlias });

export const getAllUrls = () => api.get("/all");

export const getStats = (code) => api.get(`/stats/${code}`);

// Auth endpoints
export const registerUser = (name, email, password) =>
  api.post("/auth/register", { name, email, password });

export const loginUser = (email, password) =>
  api.post("/auth/login", { email, password });

export const getMe = () => api.get("/auth/me");