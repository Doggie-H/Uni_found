import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import axiosClient from "./api/axios-client";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const CreateItem = lazy(() => import("./pages/CreateItem"));
const ItemDetail = lazy(() => import("./pages/ItemDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const MyPosts = lazy(() => import("./pages/MyPosts"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminItems = lazy(() => import("./pages/AdminItems"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));

const VISITOR_KEY = "unifound_visitor_id";
const SESSION_KEY = "unifound_session_id";
const SESSION_LAST_TOUCH_KEY = "unifound_session_last_touch";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const generateId = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

const getOrCreateVisitorId = () => {
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = generateId("v");
    localStorage.setItem(VISITOR_KEY, visitorId);
  }
  return visitorId;
};

const getOrCreateSessionId = () => {
  const now = Date.now();
  const sessionId = sessionStorage.getItem(SESSION_KEY);
  const lastTouch = Number(sessionStorage.getItem(SESSION_LAST_TOUCH_KEY) || 0);

  if (sessionId && now - lastTouch < SESSION_TIMEOUT_MS) {
    sessionStorage.setItem(SESSION_LAST_TOUCH_KEY, String(now));
    return sessionId;
  }

  const newSessionId = generateId("s");
  sessionStorage.setItem(SESSION_KEY, newSessionId);
  sessionStorage.setItem(SESSION_LAST_TOUCH_KEY, String(now));
  return newSessionId;
};

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    const sessionId = getOrCreateSessionId();
    const path = `${location.pathname}${location.search}`;

    axiosClient
      .post("/analytics/visit", {
        event_type: "page_view",
        source: "web",
        path,
        referrer: document.referrer || null,
        visitor_id: visitorId,
        session_id: sessionId,
      })
      .catch(() => {});
  }, [location.pathname, location.search]);

  return null;
}

const AppLoadingFallback = () => (
  <div
    style={{
      minHeight: "50vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--muted)",
      fontSize: "0.95rem",
    }}
  >
    Đang tải giao diện...
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnalyticsTracker />
        <Suspense fallback={<AppLoadingFallback />}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="create-item" element={<CreateItem />} />
              <Route path="item/:id" element={<ItemDetail />} />
              <Route path="messages" element={<Messages />} />
              <Route path="my-posts" element={<MyPosts />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Admin />} />
              <Route path="items" element={<AdminItems />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
