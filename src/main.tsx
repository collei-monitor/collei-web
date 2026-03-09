import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthInitializer } from "@/components/AuthInitializer";
import { Toaster } from "@/components/ui/sonner";
import router from "@/router";
import i18n from "@/config/i18n";
import "./index.css";

// i18n 初始化
void i18n;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster />
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          {/* AuthInitializer 在路由渲染前完成 GET /me，确保守卫拿到正确的 auth 状态 */}
          <AuthInitializer>
            <RouterProvider router={router} />
          </AuthInitializer>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
