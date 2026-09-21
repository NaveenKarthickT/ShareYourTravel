import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("cp_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [activeOrg, setActiveOrg] = useState(() => {
    const stored = sessionStorage.getItem("cp_active_org");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    sessionStorage.setItem("cp_token", data.data.token);
    sessionStorage.setItem("cp_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    sessionStorage.setItem("cp_token", data.data.token);
    sessionStorage.setItem("cp_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = () => {
    sessionStorage.removeItem("cp_token");
    sessionStorage.removeItem("cp_user");
    sessionStorage.removeItem("cp_active_org");
    setUser(null);
    setActiveOrg(null);
  };

  const chooseOrg = (org, membership) => {
    const value = { org, membership };
    sessionStorage.setItem("cp_active_org", JSON.stringify(value));
    setActiveOrg(value);
  };

  const refreshUser = async () => {
    const { data } = await api.get("/auth/me");
    sessionStorage.setItem("cp_user", JSON.stringify(data.data));
    setUser(data.data);
    return data.data;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.patch("/auth/profile", payload);
    sessionStorage.setItem("cp_user", JSON.stringify(data.data));
    setUser(data.data);
    return data.data;
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, login, register, logout, loading, setLoading,
      activeOrg, chooseOrg, updateProfile, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
