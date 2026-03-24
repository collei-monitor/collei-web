/**
 * 公开配置 API
 * 获取展示端自定义代码（custom_headers / custom_body）
 */

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface PublicConfig {
  custom_headers: string;
  custom_body: string;
}

export const publicConfigKeys = {
  all: ["publicConfig"] as const,
};

async function fetchPublicConfig(): Promise<PublicConfig> {
  const { status, data } = await api.get("/public/custom");
  if (status !== 200) throw new Error("Failed to fetch public config");
  return data as PublicConfig;
}

export function usePublicConfig() {
  return useQuery({
    queryKey: publicConfigKeys.all,
    queryFn: fetchPublicConfig,
    staleTime: 60_000,
  });
}
