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
  /** 应用启动时调用，验证本地 token 并拉取用户信息 */
  fetchMe: () => Promise<void>;
  /** 登录成功后：保存 token 并立即拉取用户信息 */
  setToken: (token: string) => Promise<void>;
  /** 登出：清除 token 与用户状态 */
  logout: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: "idle",

  fetchMe: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ status: "unauthenticated", user: null });
      return;
    }

    set({ status: "loading" });
    try {
      const { status, data } = await api.get("/auth/me");
      if (status === 200) {
        set({ user: data as AuthUser, status: "authenticated" });
      } else {
        localStorage.removeItem("access_token");
        set({ user: null, status: "unauthenticated" });
      }
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },

  setToken: async (token: string) => {
    localStorage.setItem("access_token", token);
    await get().fetchMe();
  },

  logout: () => {
    localStorage.removeItem("access_token");
    set({ user: null, status: "logout" });
  },
}));
