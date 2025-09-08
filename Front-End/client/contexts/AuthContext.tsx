import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: number;
  name: string;
  loginId: string;
  email: string;
  phoneNumber: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (loginId: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로딩 시 현재 사용자 정보 확인
  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    console.log('AuthContext: 사용자 정보 확인 시작');
    try {
      const response = await apiClient.getCurrentUser();
      console.log('AuthContext: 사용자 정보 응답:', response);
      if (response.success && response.member) {
        setUser(response.member);
        console.log('AuthContext: 사용자 설정됨:', response.member);
      } else {
        console.log('AuthContext: 사용자 정보 없음');
        setUser(null);
      }
    } catch (error) {
      console.log('AuthContext: 사용자 정보 확인 실패:', error);
      setUser(null);
    } finally {
      console.log('AuthContext: 로딩 완료');
      setIsLoading(false);
    }
  };

  const login = async (loginId: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.login({ loginId, password });
      if (response.success && response.member) {
        setUser(response.member);
        return true;
      }
      return false;
    } catch (error) {
      console.error('로그인 실패:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    } finally {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};