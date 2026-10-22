/** Dữ liệu form đăng nhập */
export interface LoginFormValues {
  email: string;
  password: string;
}

/** Dữ liệu form đăng ký */
export interface RegisterFormValues {
  email: string;
  otp: string;
  displayName: string;
  password: string;
}

/** Dữ liệu form quên mật khẩu (bước 1: gửi email) */
export interface ForgotPasswordFormValues {
  email: string;
}

/** Dữ liệu đặt lại mật khẩu (bước 3) */
export interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

/** Thông tin người dùng trong auth state */
export interface User {
  id: number | string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
}

/** Dữ liệu trả về sau khi đăng nhập thành công */
export interface LoginResponseData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

/** Cấu trúc response chuẩn từ API Auth */
export interface AuthApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

/** Kiểu dữ liệu Auth Context */
export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponseData>;
  logout: () => Promise<void>;
}

/** Chế độ hiển thị form */
export type AuthMode = 'login' | 'register' | 'forgot-password';

/** Bước trong flow quên mật khẩu */
export type ForgotPasswordStep = 'email' | 'otp' | 'new-password' | 'success';

