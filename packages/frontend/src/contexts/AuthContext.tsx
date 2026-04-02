import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/auth.api';

export type UserRole = 'ADMIN' | 'KEY_USER' | 'USER';
export type UserPermission = 'finance' | 'otc' | 'ptp' | 'production' | 'warehouse' | 'reports';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginTime: Date | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: UserPermission) => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [loginTime, setLoginTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('loginTime');
    return saved ? new Date(saved) : null;
  });

  useEffect(() => {
    // 如果有token，获取当前用户信息
    if (token) {
      // 设置超时，3秒后自动结束loading状态
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 3000);

      authApi.getCurrentUser()
        .then((userData: any) => {
          setUser(userData);
        })
        .catch(() => {
          // token无效，清除
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          clearTimeout(timeout);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const result: any = await authApi.login({ username, password });
    const { token: newToken, user: userData } = result;

    const now = new Date();
    localStorage.setItem('token', newToken);
    localStorage.setItem('loginTime', now.toISOString());
    setToken(newToken);
    setUser(userData);
    setLoginTime(now);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
    setToken(null);
    setUser(null);
    setLoginTime(null);
  };

  const hasPermission = (permission: UserPermission): boolean => {
    if (!user) return false;
    // ADMIN 和 KEY_USER 有所有权限
    if (user.role === 'ADMIN' || user.role === 'KEY_USER') return true;
    // 检查具体权限 - 处理字符串或数组的情况
    const perms = user.permissions;
    if (!perms) return false;
    if (typeof perms === 'string') {
      try {
        const parsed = JSON.parse(perms);
        return Array.isArray(parsed) && parsed.includes(permission);
      } catch {
        return false;
      }
    }
    return Array.isArray(perms) && perms.includes(permission);
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginTime, login, logout, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
