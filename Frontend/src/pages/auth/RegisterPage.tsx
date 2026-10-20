import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../../components/auth/RegisterForm';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <RegisterForm
      onLogin={() => navigate('/login')}
      onRegisterSuccess={() => navigate('/login')}
    />
  );
};

export default RegisterPage;
