import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("shiftup_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("shiftup_token");
    if (token) {
      api.get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem("shiftup_user", JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem("shiftup_token");
          localStorage.removeItem("shiftup_user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("shiftup_token", res.data.token);
    localStorage.setItem("shiftup_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    localStorage.setItem("shiftup_token", res.data.token);
    localStorage.setItem("shiftup_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("shiftup_token");
    localStorage.removeItem("shiftup_user");
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("shiftup_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
