import React, { createContext, useState } from "react";
import axiosClient from "../api/axios-client";
import getApiErrorMessage from "../utils/get-api-error-message";

/* eslint-disable react-refresh/only-export-components */

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("unifound_user");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  const login = async (username, password) => {
    try {
      const res = await axiosClient.post("/auth/login", { username, password });
      localStorage.setItem("unifound_token", res.data.token);
      setUser(res.data.user);
      localStorage.setItem("unifound_user", JSON.stringify(res.data.user));
      return res.data.user;
    } catch (err) {
      console.error("Đăng nhập thất bại:", err);
      throw new Error(
        getApiErrorMessage(err, "Đăng nhập thất bại. Vui lòng thử lại."),
      );
    }
  };

  // Register nhận đầy đủ thông tin sinh viên UED
  const register = async (username, password, full_name, khoa, nganh) => {
    try {
      await axiosClient.post("/auth/register", {
        username,
        password,
        full_name,
        khoa,
        nganh,
      });
      return true;
    } catch (err) {
      throw new Error(
        getApiErrorMessage(err, "Đăng ký thất bại. Vui lòng thử lại."),
      );
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("unifound_token");
    localStorage.removeItem("unifound_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
