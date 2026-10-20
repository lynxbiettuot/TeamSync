import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (_data: unknown) => {
    navigate('/dashboard');
  };

  return (
    <LoginForm
      onRegister={() => navigate('/register')}
      onForgotPassword={() => navigate('/forgot-password')}
      onLoginSuccess={handleLoginSuccess}
    />
  );
};

export default LoginPage;
