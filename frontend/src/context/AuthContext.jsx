import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => { try { const s = localStorage.getItem("shiftup_user"); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("shiftup_token");
    if (token) {
      api.get("/auth/me")
        .then((res) => { setUser(res.data.user); localStorage.setItem("shiftup_user", JSON.stringify(res.data.user)); })
        .catch(() => { localStorage.removeItem("shiftup_token"); localStorage.removeItem("shiftup_user"); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const _persist = (token, user) => {
    localStorage.setItem("shiftup_token", token);
    localStorage.setItem("shiftup_user", JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    _persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    _persist(res.data.token, res.data.user);
    return res.data.user;
  };

  // Called by OAuthCallback page after the redirect from backend
  const loginWithOAuthData = (token, userData) => {
    _persist(token, userData);
  };

  const logout = () => {
    localStorage.removeItem("shiftup_token");
    localStorage.removeItem("shiftup_user");
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem("shiftup_user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, loginWithOAuthData, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);