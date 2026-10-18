import React, { useState } from 'react';
import type { AuthMode } from '../../types/auth.types';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

interface AuthCardProps {
  initialMode?: AuthMode;
  onLoginSuccess?: (data: unknown) => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({ initialMode = 'login', onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <div className="auth-card">
      {mode === 'login' && (
        <LoginForm
          onRegister={() => setMode('register')}
          onForgotPassword={() => setMode('forgot-password')}
          onLoginSuccess={onLoginSuccess}
        />
      )}

      {mode === 'register' && (
        <RegisterForm
          onLogin={() => setMode('login')}
          onRegisterSuccess={() => setMode('login')}
        />
      )}

      {mode === 'forgot-password' && (
        <ForgotPasswordForm
          onBackToLogin={() => setMode('login')}
        />
      )}
    </div>
  );
};
