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

/** Chế độ hiển thị form */
export type AuthMode = 'login' | 'register' | 'forgot-password';

/** Bước trong flow quên mật khẩu */
export type ForgotPasswordStep = 'email' | 'otp' | 'new-password' | 'success';
