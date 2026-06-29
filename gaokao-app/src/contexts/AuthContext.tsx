import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, UserResponse, LoginRequest, RegisterRequest } from '../api/auth';

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('auth_token'),
  );
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：如果 localStorage 有 token，验证并获取用户信息
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      authApi
        .getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('auth_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const result = await authApi.login(data);
    localStorage.setItem('auth_token', result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const registerFn = useCallback(async (data: RegisterRequest) => {
    const result = await authApi.register(data);
    localStorage.setItem('auth_token', result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (_err) {
      // 即使服务端登出失败，也清除本地状态
    }
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register: registerFn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
