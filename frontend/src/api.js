import axios from "axios";

const api = axios.create({
  baseURL: "https://spliter.xyz/api"
});

export const shortenUrl = (originalUrl, customAlias) =>
  api.post("/shorten", { originalUrl, customAlias });

export const getAllUrls = () => api.get("/all");

export const getStats = (code) => api.get(`/stats/${code}`);
