import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout, LoginPage, RegisterPage, ForgotPasswordPage } from "../pages/auth";
import DashboardPage from "../pages/dashboard/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Mặc định chuyển hướng về /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Cụm trang xác thực (dùng chung AuthLayout) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Trang tổng quan sau khi đăng nhập */}
      <Route path="/dashboard" element={<DashboardPage />} />

      {/* Trang 404 cho các đường dẫn không tồn tại */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
