import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RegisterFormValues } from '../../types/auth.types';
import { authService } from '../../services/authService';
import { isValidEmail } from '../../utils/validation';
import { GoogleIcon, FacebookIcon, EyeIcon, EyeOffIcon, SpinnerIcon, AlertCircleIcon, ArrowLeftIcon } from '../icons';

interface RegisterFormProps {
  onLogin?: () => void;
  onRegisterSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onLogin, onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterFormValues>({ email: '', otp: '', displayName: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [showPw, setShowPw] = useState(false);
  const [otpSent, setOtpSent] = useState(false);       // OTP đã gửi chưa
  const [otpLoading, setOtpLoading] = useState(false); // Đang gửi OTP
  const [countdown, setCountdown] = useState(0);       // Đếm ngược gửi lại OTP (giây)
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLogin = onLogin || (() => navigate('/login'));
  const handleRegisterSuccess = onRegisterSuccess || (() => navigate('/login'));

  // Dọn dẹp timer khi component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = (seconds: number = 60) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  // Gửi mã xác minh email
  const handleSendOtp = async () => {
    if (otpLoading || (otpSent && countdown > 0)) return;

    if (!form.email.trim()) {
      return setErrors(prev => ({ ...prev, email: 'Vui lòng nhập email' }));
    }
    if (!isValidEmail(form.email)) {
      return setErrors(prev => ({ ...prev, email: 'Email không hợp lệ' }));
    }

    setOtpLoading(true);
    setApiError('');
    try {
      await authService.sendRegisterOtp(form.email.trim());
      setOtpSent(true);
      startCountdown(60);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Gửi mã xác minh thất bại');
    } finally {
      setOtpLoading(false);
    }
  };

  // Nút tạo tài khoản chỉ bấm được khi:
  // 1. Đã bấm gửi email và nhận OTP thành công (otpSent === true)
  // 2. Đã nhập đủ 3 trường: Mã xác minh (otp), Tên người dùng (displayName), Mật khẩu (password)
  const isAllFieldsFilled = Boolean(
    otpSent &&
    form.email.trim() &&
    form.otp.trim() &&
    form.displayName.trim() &&
    form.password.trim()
  );

  // Validate toàn bộ form trước khi đăng ký
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = 'Vui lòng nhập email';
    else if (!isValidEmail(form.email)) errs.email = 'Email không hợp lệ';
    if (!form.otp.trim()) errs.otp = 'Vui lòng nhập mã xác minh';
    if (!form.displayName.trim()) errs.displayName = 'Vui lòng nhập tên người dùng';
    if (!form.password) errs.password = 'Vui lòng nhập mật khẩu';
    else if (form.password.length < 8) errs.password = 'Mật khẩu tối thiểu 8 ký tự';
    if (!agreeTerms) errs.terms = 'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await authService.register(
        form.email.trim(),
        form.otp.trim(),
        form.displayName.trim(),
        form.password
      );
      handleRegisterSuccess();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const getOtpButtonText = () => {
    if (otpLoading) {
      return (
        <>
          <SpinnerIcon /> Đang gửi...
        </>
      );
    }
    if (otpSent && countdown > 0) {
      return `Gửi lại sau ${countdown}s`;
    }
    if (otpSent && countdown === 0) {
      return 'Gửi lại mã xác minh';
    }
    return 'Gửi mã xác minh';
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
            setCountdown(0);
            if (timerRef.current) clearInterval(timerRef.current);
            setForm(prev => ({ ...prev, otp: '' }));
          } else {
            handleLogin();
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

      <form className="auth-form" onSubmit={handleSubmit}>
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
              required
            />
          </div>
          {errors.email && <span className="auth-error-msg">{errors.email}</span>}
        </div>

        {/* Gửi mã xác minh / Đếm ngược */}
        <button
          type="button"
          className="auth-btn auth-btn-secondary"
          onClick={handleSendOtp}
          disabled={otpLoading || (otpSent && countdown > 0)}
        >
          {getOtpButtonText()}
        </button>

        {/* OTP — chỉ hiện sau khi gửi mã xác minh (ảnh 2) */}
        {otpSent && (
          <div className="auth-field">
            <div className="auth-input-wrap">
              <input
                type="text"
                name="otp"
                className={`auth-input ${errors.otp ? 'has-error' : ''}`}
                placeholder="Mã xác minh"
                value={form.otp}
                onChange={handleChange}
                disabled={loading}
                autoComplete="one-time-code"
                required
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
              required
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
              minLength={8}
              required
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
              required
            />
            <span>
              Tôi đồng ý với <strong className="auth-link">Điều khoản dịch vụ</strong> và <strong className="auth-link">Chính sách bảo mật</strong>.
            </span>
          </label>
          {errors.terms && <span className="auth-error-msg">{errors.terms}</span>}
        </div>

        {/* Submit — chưa gửi OTP hoặc chưa điền đủ 3 trường thì disabled */}
        <button
          type="submit"
          className="auth-btn auth-btn-primary"
          disabled={!isAllFieldsFilled || loading}
        >
          {loading ? <><SpinnerIcon /> Đang tạo tài khoản...</> : 'Tạo tài khoản'}
        </button>
      </form>

      {/* Footer */}
      <div className="auth-footer">
        Đã có tài khoản?{' '}
        <button type="button" className="auth-link" onClick={handleLogin}>Đăng nhập</button>
      </div>
    </>
  );
};
