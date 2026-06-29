/// <reference types="vite/client" />

/**
 * 通用 HTTP 客户端
 *
 * 统一封装 fetch，处理后端标准响应结构 `{ code, data, message }`。
 * 基础地址可通过环境变量 `VITE_API_BASE_URL` 配置，默认使用相对路径 `/api`，
 * 开发环境下由 Vite 代理转发到后端服务。
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/** 后端统一响应结构 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/** 后端请求错误 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new ApiError(
      `网络请求失败：${err instanceof Error ? err.message : String(err)}`,
      -1
    );
  }

  let json: ApiResponse<T>;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch (err) {
    throw new ApiError(
      `响应解析失败：${err instanceof Error ? err.message : String(err)}`,
      -2,
      response.status
    );
  }

  if (!response.ok || json.code !== 0) {
    throw new ApiError(
      json.message || `请求失败（${response.status}）`,
      json.code ?? response.status,
      response.status
    );
  }

  return json.data;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body);
}
