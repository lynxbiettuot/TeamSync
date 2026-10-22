import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout, LoginPage, RegisterPage, ForgotPasswordPage } from "../pages/auth";
import ChatPage from "../pages/chat/ChatPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Route công khai: /login, /register, /forgot-password (nếu đã login sẽ chuyển sang /chat) */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      {/* Route bảo vệ: Yêu cầu Access Token trong memory (F5 tự khôi phục phiên từ HttpOnly Cookie) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      {/* Mặc định chuyển hướng về /chat (ProtectedRoute sẽ chuyển sang /login nếu chưa xác thực) */}
      <Route path="/" element={<Navigate to="/chat" replace />} />

      {/* Trang 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
