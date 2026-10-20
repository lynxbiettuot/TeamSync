import React from 'react';
import { Outlet } from 'react-router-dom';
import '../../styles/auth.css';

export const AuthLayout: React.FC = () => {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
