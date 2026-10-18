import React, { useState } from 'react';
import type { RegisterFormValues } from '../../types/auth.types';
import { authService } from '../../services/authService';
import { isValidEmail } from '../../utils/validation';
import { GoogleIcon, FacebookIcon, EyeIcon, EyeOffIcon, SpinnerIcon, AlertCircleIcon, ArrowLeftIcon } from '../icons';

interface RegisterFormProps {
  onLogin: () => void;
  onRegisterSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onLogin, onRegisterSuccess }) => {
  const [form, setForm] = useState<RegisterFormValues>({ email: '', otp: '', displayName: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [showPw, setShowPw] = useState(false);
  const [otpSent, setOtpSent] = useState(false);     // OTP đã gửi chưa
  const [otpLoading, setOtpLoading] = useState(false); // Đang gửi OTP
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  // Gửi mã xác minh email
  const handleSendOtp = async () => {
    if (!form.email.trim()) return setErrors({ email: 'Vui lòng nhập email' });
    if (!isValidEmail(form.email)) return setErrors({ email: 'Email không hợp lệ' });

    setOtpLoading(true);
    setApiError('');
    try {
      await authService.sendRegisterOtp(form.email);
      setOtpSent(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Gửi mã xác minh thất bại');
    } finally {
      setOtpLoading(false);
    }
  };

  // Validate toàn bộ form trước khi đăng ký
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = 'Vui lòng nhập email';
    else if (!isValidEmail(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.otp.trim()) errs.otp = 'Vui lòng nhập mã xác minh';
    if (!form.displayName.trim()) errs.displayName = 'Vui lòng nhập tên người dùng';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 6) errs.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (!agreeTerms) errs.terms = 'Bạn cần đồng ý với điều khoản';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await authService.register(form.email, form.otp, form.displayName, form.password);
      onRegisterSuccess?.();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Nút quay lại điều hướng */}
      <button
        type="button"
        className="auth-back-btn"
        onClick={() => {
          if (otpSent) {
            setOtpSent(false);
          } else {
            onLogin();
          }
        }}
        aria-label="Quay lại"
      >
        <ArrowLeftIcon size={18} />
        <span>{otpSent ? 'Quay lại nhập email' : 'Quay lại đăng nhập'}</span>
      </button>

      {/* Header */}
      <div className="auth-header">
        <h1 className="auth-title">Tạo tài khoản</h1>
        <p className="auth-subtitle">Chúng tôi sẽ gửi mã xác nhận đến email của bạn.</p>
      </div>

      {/* Social — chỉ icon, chưa có chức năng */}
      <div className="auth-social-row">
        <button type="button" className="auth-social-btn" aria-label="Google">
          <GoogleIcon size={22} />
        </button>
        <button type="button" className="auth-social-btn" aria-label="Facebook">
          <FacebookIcon size={22} />
        </button>
      </div>

      {/* Error */}
      {apiError && (
        <div className="auth-alert auth-alert-error">
          <AlertCircleIcon size={16} />
          <span>{apiError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="auth-field">
          <div className="auth-input-wrap">
            <input
              type="email"
              name="email"
              className={`auth-input ${errors.email ? 'has-error' : ''}`}
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              disabled={loading || otpSent}
              autoComplete="email"
            />
          </div>
          {errors.email && <span className="auth-error-msg">{errors.email}</span>}
        </div>

        {/* Gửi mã xác minh */}
        <button
          type="button"
          className="auth-btn auth-btn-secondary"
          onClick={handleSendOtp}
          disabled={otpLoading || otpSent}
        >
          {otpLoading ? <><SpinnerIcon /> Đang gửi...</> : otpSent ? '✓ Đã gửi mã xác minh' : 'Gửi mã xác minh'}
        </button>

        {/* OTP — chỉ hiện sau khi gửi */}
        {otpSent && (
          <div className="auth-field">
            <div className="auth-input-wrap">
              <input
                type="text"
                name="otp"
                className={`auth-input ${errors.otp ? 'has-error' : ''}`}
                placeholder="Nhập mã xác minh"
                value={form.otp}
                onChange={handleChange}
                disabled={loading}
                autoComplete="one-time-code"
              />
            </div>
            {errors.otp && <span className="auth-error-msg">{errors.otp}</span>}
          </div>
        )}

        {/* Tên người dùng */}
        <div className="auth-field">
          <div className="auth-input-wrap">
            <input
              type="text"
              name="displayName"
              className={`auth-input ${errors.displayName ? 'has-error' : ''}`}
              placeholder="Tên người dùng"
              value={form.displayName}
              onChange={handleChange}
              disabled={loading}
              autoComplete="name"
            />
          </div>
          {errors.displayName && <span className="auth-error-msg">{errors.displayName}</span>}
        </div>

        {/* Mật khẩu */}
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
              autoComplete="new-password"
            />
            <button type="button" className="auth-toggle-pw" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && <span className="auth-error-msg">{errors.password}</span>}
        </div>

        {/* Điều khoản */}
        <div className="auth-field">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
              }}
              disabled={loading}
            />
            <span>
              Tôi đồng ý với <strong className="auth-link">Điều khoản dịch vụ</strong> và <strong className="auth-link">Chính sách bảo mật</strong>.
            </span>
          </label>
          {errors.terms && <span className="auth-error-msg">{errors.terms}</span>}
        </div>

        {/* Submit */}
        <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
          {loading ? <><SpinnerIcon /> Đang tạo tài khoản...</> : 'Tạo tài khoản'}
        </button>
      </form>

      {/* Footer */}
      <div className="auth-footer">
        Đã có tài khoản?{' '}
        <button type="button" className="auth-link" onClick={onLogin}>Đăng nhập</button>
      </div>
    </>
  );
};
