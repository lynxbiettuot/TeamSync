// src/utils/validation.ts

/**
 * Kiểm tra định dạng email hợp lệ
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

/**
 * Kiểm tra độ mạnh của mật khẩu:
 * - Ít nhất 6 ký tự (có thể tăng lên 8 nếu cần)
 */
export const isValidPassword = (password: string, minLength: number = 6): boolean => {
  return password.length >= minLength;
};

/**
 * Đánh giá độ mạnh mật khẩu theo điểm 0 - 4
 * Trả về: { score, label, color }
 */
export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  if (!password) {
    return { score: 0, label: '', color: 'transparent' };
  }

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, label: 'Rất yếu', color: '#ef4444' };
  if (score === 2) return { score: 2, label: 'Yếu', color: '#f59e0b' };
  if (score === 3) return { score: 3, label: 'Trung bình', color: '#3b82f6' };
  return { score: 4, label: 'Mạnh', color: '#10b981' };
};
