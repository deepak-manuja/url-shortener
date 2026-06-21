import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://url-shortener-backend-9drd.onrender.com",
});

export const shortenUrl = (originalUrl, customAlias) =>
  api.post("/shorten", { originalUrl, customAlias });

export const getAllUrls = () => api.get("/all");

export const getStats = (code) => api.get(`/stats/${code}`);
