import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ForgotPasswordForm
      onBackToLogin={() => navigate('/login')}
    />
  );
};

export default ForgotPasswordPage;
