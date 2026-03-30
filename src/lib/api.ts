/**
 * API 配置与实例
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_TIMEOUT_MS = 15_000;

export const api = {
  async request<P extends object = Record<string, string | number | boolean>>(
    endpoint: string,
    options: RequestInit & { params?: P } = {} as RequestInit & { params?: P }
  ) {
    const { params, ...fetchOptions } = options;

    // 构建 URL
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const queryString = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryString.append(key, String(value));
        }
      });
      url += `?${queryString.toString()}`;
    }

    // 设置默认请求头
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(fetchOptions.headers as Record<string, string>),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: fetchOptions.signal ?? controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    // 处理 401 未授权：广播事件，由 AuthInitializer 统一处理跳转
    if (response.status === 401 && !endpoint.endsWith("/auth/logout")) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  },

  get<P extends object = Record<string, string | number | boolean>>(endpoint: string, params?: P) {
    return this.request(endpoint, { method: "GET", params });
  },

  post<P extends object = Record<string, string | number | boolean>>(endpoint: string, body?: unknown, params?: P) {
    return this.request(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      params,
    });
  },

  put<P extends object = Record<string, string | number | boolean>>(endpoint: string, body?: unknown, params?: P) {
    return this.request(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      params,
    });
  },

  delete<P extends object = Record<string, string | number | boolean>>(endpoint: string, params?: P) {
    return this.request(endpoint, { method: "DELETE", params });
  },
};

export default api;
