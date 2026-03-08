/**
 * API 配置与实例
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = {
  async request(
    endpoint: string,
    options: RequestInit & { params?: Record<string, any> } = {}
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

    // 添加 Token（如果存在）
    const token = localStorage.getItem("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // 处理 401 未授权：清除 token 并广播事件，由 AuthInitializer 统一处理跳转
    if (response.status === 401) {
      localStorage.removeItem("access_token");
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
  },

  get(endpoint: string, params?: Record<string, any>) {
    return this.request(endpoint, { method: "GET", params });
  },

  post(endpoint: string, body?: any, params?: Record<string, any>) {
    return this.request(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      params,
    });
  },

  put(endpoint: string, body?: any, params?: Record<string, any>) {
    return this.request(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      params,
    });
  },

  delete(endpoint: string, params?: Record<string, any>) {
    return this.request(endpoint, { method: "DELETE", params });
  },
};

export default api;
