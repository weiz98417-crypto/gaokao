/**
 * 认证 API 客户端
 *
 * 封装 fetch，处理后端标准响应结构 `{ code, data, message }`。
 * 认证端点挂载在 `/api/auth`，通过 Vite 代理转发到后端。
 */

const API_BASE = '/api/auth';

/** 后端统一响应结构 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/** 后端请求错误 */
export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const mergedOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  let response: Response;
  try {
    response = await fetch(url, mergedOptions);
  } catch (err) {
    throw new AuthApiError(
      `网络请求失败：${err instanceof Error ? err.message : String(err)}`,
      -1,
    );
  }

  let json: ApiResponse<T>;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch (err) {
    throw new AuthApiError(
      `响应解析失败：${err instanceof Error ? err.message : String(err)}`,
      -2,
      response.status,
    );
  }

  if (!response.ok || json.code !== 0) {
    throw new AuthApiError(
      json.message || `请求失败（${response.status}）`,
      json.code ?? response.status,
      response.status,
    );
  }

  return json.data;
}

/** 带认证令牌的请求 */
async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  return request<T>(path, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
}

/* ========== 类型定义 ========== */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  nickname: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

/* ========== API 方法 ========== */

export const authApi = {
  /** 注册 */
  register: (data: RegisterRequest): Promise<AuthResponse> =>
    request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 登录 */
  login: (data: LoginRequest): Promise<AuthResponse> =>
    request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /** 发送验证码 */
  sendVerification: (email: string, type: string = 'register'): Promise<void> =>
    request<void>('/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email, type }),
    }),

  /** 验证邮箱 */
  verifyEmail: (email: string, code: string): Promise<void> =>
    request<void>('/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  /** 获取当前用户信息 */
  getMe: (): Promise<UserResponse> => authRequest<UserResponse>('/me'),

  /** 登出 */
  logout: (): Promise<void> =>
    authRequest<void>('/logout', { method: 'POST' }),
};
