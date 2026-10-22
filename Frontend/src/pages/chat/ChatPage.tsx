// src/pages/chat/ChatPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/apiClient';

export const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: string; time: string }>>([
    {
      id: 1,
      text: `Xin chào ${user?.displayName || 'bạn'}! Chào mừng bạn đến với TeamSync Workspace.`,
      sender: 'Hệ thống',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [testApiStatus, setTestApiStatus] = useState<string | null>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: inputText.trim(),
      sender: user?.displayName || user?.email || 'Tôi',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  // Nút test gọi API có authentication Header Bearer <accessToken>
  const handleTestProtectedApi = async () => {
    try {
      setTestApiStatus('Đang gửi request với Header Authorization: Bearer <accessToken>...');
      // Gọi thử endpoint bảo vệ (nếu backend có API, apiClient sẽ tự đính kèm token và auto-refresh nếu 401)
      const res = await apiClient.get<any>('/api/users/me');
      setTestApiStatus(`Thành công: ${JSON.stringify(res)}`);
    } catch (err) {
      setTestApiStatus(`Kết quả: ${err instanceof Error ? err.message : 'API test hoàn thành'}`);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: '60px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
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
              fontSize: '16px',
            }}
          >
            TS
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#1E293B' }}>TeamSync Chat</div>
            <div style={{ fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
              Trực tuyến ({user?.status || 'ACTIVE'})
            </div>
          </div>
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{user?.displayName || 'Người dùng'}</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>{user?.email}</div>
          </div>
          <button
            onClick={() => logout()}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#EF4444',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '13.5px',
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
        </div>
      </header>

      {/* Main Chat Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: '280px',
            background: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>
            Kênh trao đổi
          </div>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#EFF6FF',
              color: '#2563EB',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '6px',
            }}
          >
            # Kênh chung (General)
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={handleTestProtectedApi}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px dashed #93C5FD',
                background: '#F0FDF4',
                color: '#166534',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Test Authenticated API
            </button>
            {testApiStatus && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748B', wordBreak: 'break-all', lineHeight: 1.4 }}>
                {testApiStatus}
              </div>
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
          {/* Message List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((m) => {
              const isMe = m.sender === (user?.displayName || user?.email || 'Tôi');
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '65%',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', textAlign: isMe ? 'right' : 'left' }}>
                    {m.sender} • {m.time}
                  </div>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: isMe ? '#2563EB' : '#FFFFFF',
                      color: isMe ? '#FFFFFF' : '#1E293B',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                      fontSize: '14px',
                      lineHeight: 1.5,
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '16px 24px',
              background: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              gap: '12px',
            }}
          >
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                height: '42px',
                padding: '0 16px',
                borderRadius: '8px',
                border: '1.5px solid #E2E8F0',
                outline: 'none',
                fontSize: '14px',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0 20px',
                borderRadius: '8px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Gửi
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
