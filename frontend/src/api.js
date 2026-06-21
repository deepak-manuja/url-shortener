import axios from "axios";

const api = axios.create({
  baseURL: "https://url-shortener-backend-9drd.onrender.com/api"
});

export const shortenUrl = (originalUrl, customAlias) =>
  api.post("/shorten", { originalUrl, customAlias });

export const getAllUrls = () => api.get("/all");

export const getStats = (code) => api.get(`/stats/${code}`);