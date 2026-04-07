import axios from "axios";

export const getApiBaseUrl = () => {
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3087";
  const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, "");

  // Calls in the app already start with /api/... so if the configured base
  // also ends with /api we strip it to avoid generating /api/api/...
  if (normalizedBaseUrl === "/api") {
    return "";
  }

  if (normalizedBaseUrl.endsWith("/api")) {
    return normalizedBaseUrl.slice(0, -4);
  }

  return normalizedBaseUrl;
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Accept": "*/*",
    "Content-Type": "application/json",
  }
});

export const setAuthToken = (token) => {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const isApiError = (err) => !!(err && err.response);