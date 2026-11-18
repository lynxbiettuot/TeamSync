// Component modal quản lý mã hóa E2EE: sao lưu cặp khóa cá nhân lên Server bằng mã PIN PBKDF2 và khôi phục khi sang thiết bị mới
import React, { useState } from 'react';
import './E2EEPinModal.css';

interface E2EEPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackupPin: (pin: string) => Promise<boolean>;
  onRestorePin: (pin: string) => Promise<boolean>;
}

export const E2EEPinModal: React.FC<E2EEPinModalProps> = ({
  isOpen,
  onClose,
  onBackupPin,
  onRestorePin,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [restorePin, setRestorePin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleBackupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (pin.length < 6) {
      setMessage({ text: 'Mã PIN bảo mật phải có ít nhất 6 ký tự!', type: 'error' });
      return;
    }

    if (pin !== confirmPin) {
      setMessage({ text: 'Mã PIN xác nhận không trùng khớp!', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onBackupPin(pin);
      if (ok) {
        setMessage({
          text: 'Sao lưu khóa riêng tư bằng mã PIN thành công! Bạn có thể dùng mã PIN này trên bất kỳ máy mới nào.',
          type: 'success',
        });
        setPin('');
        setConfirmPin('');
      } else {
        setMessage({ text: 'Sao lưu thất bại. Vui lòng thử lại!', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Đã xảy ra lỗi khi sao lưu khóa.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!restorePin) {
      setMessage({ text: 'Vui lòng nhập mã PIN!', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onRestorePin(restorePin);
      if (ok) {
        setMessage({
          text: 'Khôi phục khóa E2EE thành công! Tin nhắn và nhóm của bạn đã sẵn sàng giải mã.',
          type: 'success',
        });
        setRestorePin('');
      } else {
        setMessage({
          text: 'Mã PIN không chính xác hoặc bạn chưa từng tạo bản sao lưu trên server!',
          type: 'error',
        });
      }
    } catch (err) {
      setMessage({ text: 'Lỗi khi khôi phục khóa E2EE.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="e2ee-modal-backdrop" onClick={onClose}>
      <div className="e2ee-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="e2ee-modal-header">
          <div className="e2ee-modal-title-row">
            <span className="e2ee-shield-icon">🛡️</span>
            <div>
              <h3>Bảo mật E2EE & Mã PIN</h3>
              <p className="e2ee-modal-desc">
                Mã hóa đầu cuối tin nhắn 1-1 và tin nhắn nhóm (K_nhom)
              </p>
            </div>
          </div>
          <button className="e2ee-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="e2ee-tabs">
          <button
            className={`e2ee-tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('backup');
              setMessage(null);
            }}
          >
            Sao lưu khóa bằng PIN
          </button>
          <button
            className={`e2ee-tab-btn ${activeTab === 'restore' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('restore');
              setMessage(null);
            }}
          >
            Khôi phục khóa từ PIN
          </button>
        </div>

        {message && (
          <div className={`e2ee-alert ${message.type === 'success' ? 'e2ee-alert-success' : 'e2ee-alert-error'}`}>
            {message.text}
          </div>
        )}

        {activeTab === 'backup' ? (
          <form onSubmit={handleBackupSubmit} className="e2ee-form">
            <p className="e2ee-note">
              💡 Đặt mã PIN để mã hóa cặp khóa riêng tư ECDH (dùng PBKDF2 100,000 vòng) và lưu an toàn trên máy chủ.
              Server chỉ lưu bản mã, không ai khác có thể giải mã được!
            </p>
            <div className="e2ee-field">
              <label>Mã PIN bảo mật mới (tối thiểu 6 ký tự)</label>
              <input
                type="password"
                placeholder="Nhập mã PIN..."
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isSubmitting}
                maxLength={32}
              />
            </div>
            <div className="e2ee-field">
              <label>Xác nhận mã PIN</label>
              <input
                type="password"
                placeholder="Nhập lại mã PIN..."
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                disabled={isSubmitting}
                maxLength={32}
              />
            </div>
            <div className="e2ee-actions">
              <button type="button" className="e2ee-btn-cancel" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="e2ee-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang mã hóa & sao lưu...' : 'Sao lưu khóa lên Server'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRestoreSubmit} className="e2ee-form">
            <p className="e2ee-note">
              📱 Nhập mã PIN bạn đã tạo trước đó để giải mã và đồng bộ cặp khóa riêng tư về thiết bị này.
            </p>
            <div className="e2ee-field">
              <label>Mã PIN khôi phục</label>
              <input
                type="password"
                placeholder="Nhập mã PIN đã sao lưu..."
                value={restorePin}
                onChange={(e) => setRestorePin(e.target.value)}
                disabled={isSubmitting}
                maxLength={32}
              />
            </div>
            <div className="e2ee-actions">
              <button type="button" className="e2ee-btn-cancel" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="e2ee-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang giải mã...' : 'Khôi phục khóa'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
