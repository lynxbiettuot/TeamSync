import React from 'react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1E293B' }}>
      {/* Top Navbar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 32px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#2563EB',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '18px',
            }}
          >
            TS
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>TeamSync</span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#EF4444',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#FEF2F2';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
          }}
        >
          Đăng xuất
        </button>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            marginBottom: '28px',
          }}
        >
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', color: '#1E293B' }}>
            Chào mừng đến với TeamSync Workspace! 🎉
          </h1>
          <p style={{ color: '#64748B', fontSize: '15px', margin: 0, lineHeight: 1.6 }}>
            Bạn đã đăng nhập thành công. Đây là trang tổng quan chính (Dashboard) của ứng dụng nhóm.
          </p>
        </div>

        {/* Feature Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>💬 Cuộc trò chuyện</h3>
            <p style={{ margin: 0, color: '#64748B', fontSize: '14px', lineHeight: 1.5 }}>
              Quản lý các tin nhắn và cuộc hội thoại thời gian thực với các thành viên trong nhóm.
            </p>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>👥 Nhóm & Phân quyền</h3>
            <p style={{ margin: 0, color: '#64748B', fontSize: '14px', lineHeight: 1.5 }}>
              Tổ chức phòng ban, dự án và thiết lập quyền hạn cho từng thành viên.
            </p>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>🔔 Thông báo</h3>
            <p style={{ margin: 0, color: '#64748B', fontSize: '14px', lineHeight: 1.5 }}>
              Cập nhật các hoạt động mới nhất, phản hồi tin nhắn và lời mời tham gia nhóm.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
