import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
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
        // WebSocket 代理：/api/v1/ws → ws(s)://backend/api/v1/ws（路径不重写）
        "/api/v1/ws": {
          target: (env.VITE_BACKEND_URL || "http://localhost:8000").replace(
            /^http/,
            "ws"
          ),
          changeOrigin: true,
          ws: true,
        },
        // HTTP 代理：/api/xxx → backend/api/v1/xxx
        "/api": {
          target: env.VITE_BACKEND_URL || "http://localhost:8000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api(?!\/)/, "/api/v1"),
        },
      },
    },
  };
});
