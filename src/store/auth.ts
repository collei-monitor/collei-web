import { create } from "zustand";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  uuid: string;
  username: string;
  sso_type: string | null;
  two_factor_enabled: boolean;
  created_at: number;
  updated_at: number;
  ws_token?: string;
  global_registration_token?: string | null;
  agent_url?: string | null;
}

export interface SSOProvider {
  name: string;
  provider_type: string;
  display_order: number;
}

/**
 * idle       — 初始状态，fetchMe 尚未执行
 * loading    — 正在请求 GET /me
 * authenticated   — 已认证，user 有值
 * unauthenticated — 未认证或 token 无效
 * logout 
 */
export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "logout";

// ── State interface ───────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  ssoProviders: SSOProvider[];
  allowPasswordLogin: boolean;
  /** 应用启动时调用，通过 Cookie 验证身份并拉取用户信息 */
  fetchMe: () => Promise<void>;
  /** 登录成功后：立即拉取用户信息（Cookie 由浏览器自动管理） */
  onLoginSuccess: () => Promise<void>;
  /** 登出：调用后端清除 Cookie 并重置状态 */
  logout: () => Promise<void>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: "idle",
  ssoProviders: [],
  allowPasswordLogin: true,

  fetchMe: async () => {
    set({ status: "loading" });
    try {
      const { status, data } = await api.get("/auth/me");
      const providers = Array.isArray(data?.providers) ? data.providers as SSOProvider[] : [];
      const allowPwd = data?.allow_password_login !== false;
      if (status === 200) {
        set({ user: data as AuthUser, status: "authenticated", ssoProviders: providers, allowPasswordLogin: allowPwd });
      } else {
        set({ user: null, status: "unauthenticated", ssoProviders: providers, allowPasswordLogin: allowPwd });
      }
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },

  onLoginSuccess: async () => {
    await get().fetchMe();
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // 即使请求失败也继续清除前端状态
    }
    // 先置为 logout，防止后续 401 事件触发递归登出
    set({ user: null, status: "logout" });
    // 重新获取 SSO providers
    try {
      const { data } = await api.get("/auth/me");
      const providers = Array.isArray(data?.providers) ? data.providers as SSOProvider[] : [];
      const allowPwd = data?.allow_password_login !== false;
      set({ ssoProviders: providers, allowPasswordLogin: allowPwd });
    } catch {
      // ignore
    }
  },
}));
