import axios from "axios";

export const getApiBaseUrl = () => {
  // Vite env: VITE_API_BASE_URL
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:3087";
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
