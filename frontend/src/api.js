import axios from "axios";

// Use local backend in development, production backend in production
const baseURL = import.meta.env.DEV 
  ? "http://localhost:5000/api"  // Development: Local backend
  : "https://url-shortener-backend-9drd.onrender.com/api";  // Production: Render backend

const api = axios.create({
  baseURL: baseURL,
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