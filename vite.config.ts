import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // 在编译时注入环境信息
      __DEV__: command === "serve",
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    // 开发服务器配置 - 代理 API 请求解决 CORS 问题
    server: {
      proxy: {
        "/api": {
          target: process.env.VITE_BACKEND_URL || "http://localhost:8000",
          changeOrigin: true,
          // 重写路由：/api/xxx → /api/v1/xxx
          rewrite: (path) => path.replace(/^\/api(?!\/)/, "/api/v1"),
        },
      },
    },
  };
});
