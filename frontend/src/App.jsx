import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axiosClient from "./api/axios-client";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CreateItem from "./pages/CreateItem";
import ItemDetail from "./pages/ItemDetail";
import Admin from "./pages/Admin";
import AdminItems from "./pages/AdminItems";
import AdminUsers from "./pages/AdminUsers";

function App() {
  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const storageKey = "unifound_last_visit_day";
    const lastVisitDay = localStorage.getItem(storageKey);

    if (lastVisitDay === todayKey) return;

    localStorage.setItem(storageKey, todayKey);
    axiosClient
      .post("/analytics/visit", {
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || null,
      })
      .catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="create-item" element={<CreateItem />} />
            <Route path="item/:id" element={<ItemDetail />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Admin />} />
            <Route path="items" element={<AdminItems />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
