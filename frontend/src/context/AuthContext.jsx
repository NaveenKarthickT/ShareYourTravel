import { createContext, useContext, useState } from "react";
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

  // Login step 1: verify password, receive OTP request
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data.data; // { requiresOtp: true, email, devOtp?, purpose: "login" }
  };

  // Login step 2: verify OTP, get token
  const verifyOtp = async (email, code) => {
    const { data } = await api.post("/auth/verify-otp", { email, code });
    sessionStorage.setItem("cp_token", data.data.token);
    sessionStorage.setItem("cp_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  };

  // Register step 1: create user, receive OTP request
  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data.data; // { requiresOtp: true, email, devOtp?, purpose: "signup" }
  };

  // Register step 2: verify signup OTP, get token
  const verifySignup = async (email, code) => {
    const { data } = await api.post("/auth/verify-signup", { email, code });
    sessionStorage.setItem("cp_token", data.data.token);
    sessionStorage.setItem("cp_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  };

  const resendOtp = async (email, purpose = "login") => {
    const { data } = await api.post("/auth/resend-otp", { email, purpose });
    return data.data;
  };

  const forgotPassword = async (email) => {
    const { data } = await api.post("/auth/forgot-password", { email });
    return data.data;
  };

  const verifyResetOtp = async (email, code) => {
    const { data } = await api.post("/auth/verify-reset-otp", { email, code });
    return data.data;
  };

  const resetPassword = async (email, resetToken, newPassword) => {
    const { data } = await api.post("/auth/reset-password", {
      email, resetToken, newPassword,
    });
    return data.data;
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
    <AuthContext.Provider value={{ user, setUser, login, verifyOtp, register, verifySignup, resendOtp, forgotPassword, verifyResetOtp, resetPassword,
      logout, loading, setLoading, activeOrg, chooseOrg, updateProfile, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
