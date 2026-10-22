import { apiClient } from './apiClient';
import type { AuthApiResponse, LoginResponseData } from '../types/auth.types';

// Thay URL backend Spring Boot tại đây
const BASE_URL = 'http://localhost:8080/api/auth';

export const authService = {
  // POST /api/auth/login — Đăng nhập (HttpOnly Refresh Token cookie tự lưu bởi browser)
  async login(email: string, password: string): Promise<AuthApiResponse<LoginResponseData>> {
    return apiClient.post<AuthApiResponse<LoginResponseData>>('/api/auth/login', {
      email,
      password,
    });
  },

  // POST /api/auth/refresh — Lấy Access Token mới từ HttpOnly Refresh Token Cookie
  async refreshToken(): Promise<AuthApiResponse<LoginResponseData>> {
    return apiClient.post<AuthApiResponse<LoginResponseData>>('/api/auth/refresh');
  },

  // POST /api/auth/logout — Đăng xuất, vô hiệu hóa Refresh Token Cookie trên Backend
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Dù backend báo lỗi gì thì phía frontend vẫn clear auth state
    }
  },

  // POST /api/auth/register/send-otp — Gửi OTP xác minh email khi đăng ký
  async sendRegisterOtp(email: string) {
    const res = await fetch(`${BASE_URL}/register/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      let errorMsg = 'Gửi mã xác minh thất bại';
      try {
        const data = await res.json();
        errorMsg = data.message || data.error || errorMsg;
      } catch {
        try {
          const text = await res.text();
          if (text) errorMsg = text;
        } catch {
          // ignore
        }
      }
      throw new Error(errorMsg);
    }
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  },

  // POST /api/auth/register — Đăng ký tài khoản (RegisterRequest: email, otp, displayName, password)
  async register(email: string, otp: string, displayName: string, password: string) {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, displayName, password }),
    });
    if (!res.ok) {
      let errorMsg = 'Đăng ký thất bại';
      try {
        const data = await res.json();
        errorMsg = data.message || data.error || errorMsg;
      } catch {
        try {
          const text = await res.text();
          if (text) errorMsg = text;
        } catch {
          // ignore
        }
      }
      throw new Error(errorMsg);
    }
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  },

  // POST /api/auth/forgot-password — Gửi mã OTP đặt lại mật khẩu
  async forgotPassword(email: string) {
    const res = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Gửi mã đặt lại thất bại');
    return res.json();
  },

  // POST /api/auth/verify-otp — Xác minh OTP (quên mật khẩu)
  async verifyResetOtp(email: string, otp: string) {
    const res = await fetch(`${BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Mã OTP không hợp lệ');
    return res.json();
  },

  // POST /api/auth/reset-password — Đặt mật khẩu mới
  async resetPassword(email: string, otp: string, newPassword: string) {
    const res = await fetch(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Đặt lại mật khẩu thất bại');
    return res.json();
  },
};
