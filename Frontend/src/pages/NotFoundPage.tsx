import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
        color: '#1E293B',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <h1 style={{ fontSize: '72px', fontWeight: 900, color: '#2563EB', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '16px 0 8px 0' }}>Không tìm thấy trang</h2>
      <p style={{ color: '#64748B', maxWidth: '400px', marginBottom: '24px' }}>
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <button
        onClick={() => navigate('/login')}
        style={{
          background: '#2563EB',
          color: '#FFFFFF',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Quay lại trang Đăng nhập
      </button>
    </div>
  );
};

export default NotFoundPage;
