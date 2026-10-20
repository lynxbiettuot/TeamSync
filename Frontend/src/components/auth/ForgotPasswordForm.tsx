import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ForgotPasswordStep } from '../../types/auth.types';
import { authService } from '../../services/authService';
import { isValidEmail } from '../../utils/validation';
import { EyeIcon, EyeOffIcon, SpinnerIcon, AlertCircleIcon, CheckCircleIcon, ArrowLeftIcon } from '../icons';

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
  const navigate = useNavigate();
  const handleBackToLogin = onBackToLogin || (() => navigate('/login'));

  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (apiError) setApiError('');
  };

  // ===== Bước 1: Gửi email =====
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setErrors({ email: 'Vui lòng nhập email' });
    if (!isValidEmail(email)) return setErrors({ email: 'Email không hợp lệ' });

    setLoading(true);
    setApiError('');
    try {
      await authService.forgotPassword(email);
      setStep('otp');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Gửi mã thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ===== Bước 2: Xác minh OTP =====
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return setErrors({ otp: 'Vui lòng nhập mã OTP' });

    setLoading(true);
    setApiError('');
    try {
      await authService.verifyResetOtp(email, otp);
      setStep('new-password');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Mã OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  // ===== Bước 3: Đặt mật khẩu mới =====
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!newPassword) errs.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (newPassword.length < 6) errs.newPassword = 'Mật khẩu tối thiểu 6 ký tự';
    if (!confirmPassword) errs.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (newPassword !== confirmPassword) errs.confirmPassword = 'Mật khẩu không khớp';
    if (Object.keys(errs).length > 0) return setErrors(errs);

    setLoading(true);
    setApiError('');
    try {
      await authService.resetPassword(email, otp, newPassword);
      setStep('success');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Error alert chung
  const errorAlert = apiError ? (
    <div className="auth-alert auth-alert-error">
      <AlertCircleIcon size={16} />
      <span>{apiError}</span>
    </div>
  ) : null;

  // ==================== BƯỚC 1: NHẬP EMAIL ====================
  if (step === 'email') {
    return (
      <>
        {/* Nút quay lại điều hướng */}
        <button type="button" className="auth-back-btn" onClick={handleBackToLogin} aria-label="Quay lại">
          <ArrowLeftIcon size={18} />
          <span>Quay lại đăng nhập</span>
        </button>

        <div className="auth-header">
          <h1 className="auth-title">Đặt lại mật khẩu</h1>
          <p className="auth-subtitle">Nhập địa chỉ email của bạn, chúng tôi sẽ gửi mã đặt lại mật khẩu.</p>
        </div>
        {errorAlert}
        <form className="auth-form" onSubmit={handleSendEmail} noValidate>
          <div className="auth-field">
            <div className="auth-input-wrap">
              <input
                type="email"
                className={`auth-input ${errors.email ? 'has-error' : ''}`}
                placeholder="Email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="auth-error-msg">{errors.email}</span>}
          </div>
          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? <><SpinnerIcon /> Đang gửi...</> : 'Gửi mã đặt lại'}
          </button>
        </form>
        <div className="auth-links-center">
          <button type="button" className="auth-link" onClick={() => setStep('otp')}>Đã có mã đặt lại?</button>
          <button type="button" className="auth-link" onClick={handleBackToLogin}>Quay lại đăng nhập</button>
        </div>
      </>
    );
  }

  // ==================== BƯỚC 2: NHẬP OTP ====================
  if (step === 'otp') {
    return (
      <>
        {/* Nút quay lại điều hướng */}
        <button type="button" className="auth-back-btn" onClick={handleBackToLogin} aria-label="Quay lại đăng nhập">
          <ArrowLeftIcon size={18} />
          <span>Quay lại đăng nhập</span>
        </button>

        <div className="auth-header">
          <h1 className="auth-title">Nhập mã xác minh</h1>
          <p className="auth-subtitle">Mã OTP đã được gửi đến <strong>{email || 'email của bạn'}</strong>.</p>
        </div>
        {errorAlert}
        <form className="auth-form" onSubmit={handleVerifyOtp} noValidate>
          <div className="auth-field">
            <div className="auth-input-wrap">
              <input
                type="text"
                className={`auth-input ${errors.otp ? 'has-error' : ''}`}
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => { setOtp(e.target.value); clearError('otp'); }}
                disabled={loading}
                autoComplete="one-time-code"
              />
            </div>
            {errors.otp && <span className="auth-error-msg">{errors.otp}</span>}
          </div>
          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? <><SpinnerIcon /> Đang xác minh...</> : 'Xác nhận'}
          </button>
        </form>
        <div className="auth-links-center">
          <button type="button" className="auth-link" onClick={() => { setStep('email'); setApiError(''); }}>Gửi lại mã?</button>
        </div>
      </>
    );
  }

  // ==================== BƯỚC 3: MẬT KHẨU MỚI ====================
  if (step === 'new-password') {
    return (
      <>
        {/* Nút quay lại điều hướng */}
        <button type="button" className="auth-back-btn" onClick={handleBackToLogin} aria-label="Quay lại đăng nhập">
          <ArrowLeftIcon size={18} />
          <span>Quay lại đăng nhập</span>
        </button>

        <div className="auth-header">
          <h1 className="auth-title">Đặt mật khẩu mới</h1>
          <p className="auth-subtitle">Nhập mật khẩu mới cho tài khoản của bạn.</p>
        </div>
        {errorAlert}
        <form className="auth-form" onSubmit={handleResetPassword} noValidate>
          <div className="auth-field">
            <div className="auth-input-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                className={`auth-input auth-input--password ${errors.newPassword ? 'has-error' : ''}`}
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); clearError('newPassword'); }}
                disabled={loading}
                autoComplete="new-password"
              />
              <button type="button" className="auth-toggle-pw" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.newPassword && <span className="auth-error-msg">{errors.newPassword}</span>}
          </div>
          <div className="auth-field">
            <div className="auth-input-wrap">
              <input
                type={showConfirmPw ? 'text' : 'password'}
                className={`auth-input auth-input--password ${errors.confirmPassword ? 'has-error' : ''}`}
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                disabled={loading}
                autoComplete="new-password"
              />
              <button type="button" className="auth-toggle-pw" onClick={() => setShowConfirmPw(!showConfirmPw)} tabIndex={-1}>
                {showConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.confirmPassword && <span className="auth-error-msg">{errors.confirmPassword}</span>}
          </div>
          <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
            {loading ? <><SpinnerIcon /> Đang cập nhật...</> : 'Cập nhật mật khẩu'}
          </button>
        </form>
        <div className="auth-links-center">
          <button type="button" className="auth-link" onClick={handleBackToLogin}>Quay lại đăng nhập</button>
        </div>
      </>
    );
  }

  // ==================== BƯỚC 4: THÀNH CÔNG ====================
  return (
    <div className="auth-success-screen">
      <div className="auth-success-icon">
        <CheckCircleIcon size={56} />
      </div>
      <h1 className="auth-title">Đổi mật khẩu thành công!</h1>
      <p className="auth-subtitle">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.</p>
      <button type="button" className="auth-btn auth-btn-primary" onClick={handleBackToLogin}>
        Đăng nhập ngay
      </button>
    </div>
  );
};
