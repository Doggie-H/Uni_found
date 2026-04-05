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

  const login = async (identifier, password) => {
    try {
      const res = await axiosClient.post("/auth/login", {
        identifier,
        password,
      });
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

  const register = async ({
    email,
    password,
    full_name,
    is_ued_student,
    khoa,
    nganh,
    mssv,
  }) => {
    try {
      await axiosClient.post("/auth/register", {
        email,
        password,
        full_name,
        is_ued_student,
        khoa,
        nganh,
        mssv,
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
