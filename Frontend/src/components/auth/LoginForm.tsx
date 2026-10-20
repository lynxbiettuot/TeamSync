import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoginFormValues } from '../../types/auth.types';
import { authService } from '../../services/authService';
import { isValidEmail } from '../../utils/validation';
import { EyeIcon, EyeOffIcon, GoogleIcon, FacebookIcon, SpinnerIcon, AlertCircleIcon } from '../icons';

interface LoginFormProps {
  onRegister?: () => void;
  onForgotPassword?: () => void;
  onLoginSuccess?: (data: unknown) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onRegister, onForgotPassword, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginFormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleRegister = onRegister || (() => navigate('/register'));
  const handleForgotPassword = onForgotPassword || (() => navigate('/forgot-password'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginFormValues]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.email.trim()) errs.email = 'Vui lòng nhập email';
    else if (!isValidEmail(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const data = await authService.login(form.email, form.password);
      onLoginSuccess?.(data);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="auth-header">
        <h1 className="auth-title">Chào mừng trở lại</h1>
        <p className="auth-subtitle">Đăng nhập để tiếp tục đến không gian làm việc của bạn.</p>
      </div>

      {/* Social login — chỉ icon, chưa có chức năng */}
      <div className="auth-social-row">
        <button type="button" className="auth-social-btn" aria-label="Google">
          <GoogleIcon size={22} />
        </button>
        <button type="button" className="auth-social-btn" aria-label="Facebook">
          <FacebookIcon size={22} />
        </button>
      </div>

      {/* Error alert */}
      {apiError && (
        <div className="auth-alert auth-alert-error">
          <AlertCircleIcon size={16} />
          <span>{apiError}</span>
        </div>
      )}

      {/* Form */}
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="auth-field">
          <div className="auth-input-wrap">
            <input
              type="email"
              name="email"
              className={`auth-input ${errors.email ? 'has-error' : ''}`}
              placeholder="Tên người dùng hoặc email"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
            />
          </div>
          {errors.email && <span className="auth-error-msg">{errors.email}</span>}
        </div>

        {/* Password */}
        <div className="auth-field">
          <div className="auth-input-wrap">
            <input
              type={showPw ? 'text' : 'password'}
              name="password"
              className={`auth-input auth-input--password ${errors.password ? 'has-error' : ''}`}
              placeholder="Mật khẩu"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
            />
            <button type="button" className="auth-toggle-pw" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && <span className="auth-error-msg">{errors.password}</span>}
        </div>

        {/* Quên mật khẩu */}
        <div className="auth-link-row">
          <button type="button" className="auth-link" onClick={handleForgotPassword}>Quên mật khẩu?</button>
        </div>

        {/* Submit */}
        <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
          {loading ? <><SpinnerIcon /> Đang đăng nhập...</> : 'Đăng nhập'}
        </button>
      </form>

      {/* Footer */}
      <div className="auth-footer">
        Không có tài khoản?{' '}
        <button type="button" className="auth-link" onClick={handleRegister}>Tạo một cái</button>
      </div>
    </>
  );
};
