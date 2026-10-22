// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthContextType, LoginResponseData } from '../types/auth.types';
import { authService } from '../services/authService';
import { tokenStorage } from '../services/apiClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Access Token và User CHỈ lưu trong React State (Memory) — KHÔNG lưu vào localStorage/sessionStorage
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Đăng xuất và dọn dẹp memory
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      tokenStorage.clear();
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  // Xử lý khi apiClient phát hiện refresh token hỏng / hết hạn
  useEffect(() => {
    tokenStorage.setOnAuthFailed(() => {
      setAccessToken(null);
      setUser(null);
    });
  }, []);

  // F5 / Reload trang: Gọi /api/auth/refresh để lấy lại Access Token từ HttpOnly Cookie
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const res = await authService.refreshToken();
        if (!isMounted) return;

        const data = res?.data;
        if (data?.accessToken && data?.user) {
          tokenStorage.set(data.accessToken);
          setAccessToken(data.accessToken);
          setUser(data.user);
        } else {
          tokenStorage.clear();
          setAccessToken(null);
          setUser(null);
        }
      } catch {
        if (!isMounted) return;
        tokenStorage.clear();
        setAccessToken(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Hàm đăng nhập
  const login = async (email: string, password: string): Promise<LoginResponseData> => {
    const res = await authService.login(email, password);
    const data = res.data;

    if (!data?.accessToken || !data?.user) {
      throw new Error('Dữ liệu phản hồi đăng nhập không hợp lệ');
    }

    // Lưu Access Token và User vào Memory
    tokenStorage.set(data.accessToken);
    setAccessToken(data.accessToken);
    setUser(data.user);

    return data;
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
