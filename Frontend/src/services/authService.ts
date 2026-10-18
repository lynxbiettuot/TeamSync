// Thay URL backend Spring Boot tại đây
const BASE_URL = 'http://localhost:8080/api/auth';

export const authService = {
  // POST /api/auth/login — Đăng nhập
  async login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Đăng nhập thất bại');
    return res.json();
  },

  // POST /api/auth/register/send-otp — Gửi OTP xác minh email khi đăng ký
  async sendRegisterOtp(email: string) {
    const res = await fetch(`${BASE_URL}/register/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Gửi mã xác minh thất bại');
    return res.json();
  },

  // POST /api/auth/register — Đăng ký tài khoản
  async register(email: string, otp: string, displayName: string, password: string) {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, displayName, password }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Đăng ký thất bại');
    return res.json();
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
