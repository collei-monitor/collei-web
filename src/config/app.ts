/**
 * 应用全局配置
 * 包含 API 地址、主题、国际化等设置
 */

export const config = {
  // API 配置
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
    timeout: 30000,
    errorMessages: {
      401: "未授权，请重新登录",
      403: "禁止访问",
      404: "资源不存在",
      500: "服务器错误",
    },
  },

  // 应用配置
  app: {
    title: import.meta.env.VITE_APP_TITLE || "Collei Monitor",
    isDev: __DEV__,
    buildTime: __BUILD_TIME__,
  },

  // 国际化配置
  i18n: {
    defaultLanguage: "zh-CN",
    supportedLanguages: ["zh-CN", "en-US"],
    storageKey: "locale",
  },

  // 存储配置
  storage: {
    tokenKey: "access_token",
    localeKey: "locale",
  },

  // 路由配置
  routes: {
    public: ["/", "/login"],
    protected: ["/admin"],
  },
};

export default config;
