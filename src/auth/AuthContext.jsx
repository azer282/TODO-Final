import React from "react";
import { api, setAuthToken } from "../api/client";

const AuthContext = React.createContext(null);

const TOKEN_KEY = "todo_token";
const USER_KEY = "todo_user";

const loadAuth = () => {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const userRaw = localStorage.getItem(USER_KEY) || "";
  const user = userRaw ? JSON.parse(userRaw) : null;
  setAuthToken(token);
  return { token, user };
};

export const AuthProvider = ({ children }) => {
  const [{ token, user }, setState] = React.useState(() => loadAuth());

  React.useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const logout = () => {
    setAuthToken("");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ token: "", user: null });
  };

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    setAuthToken(data.accessToken);
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ token: data.accessToken, user: data.user });
  };

  const register = async (email, password, displayName) => {
    await api.post("/api/auth/register", { email, password, displayName });
    // auto-login for convenience
    await login(email, password);
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
