/**
 * DNS 管理相关类型定义
 * 基于 /api/v1/dns 接口
 */

// ── 凭证 (Credentials) ───────────────────────────────────────────────────────

export interface CredentialRead {
  id: number;
  name: string;
  provider: string;
  is_valid: number;
  created_at: number;
  updated_at: number;
}

export interface CreateCredentialPayload {
  name: string;
  provider: string;
  credentials: Record<string, string>;
}

export interface UpdateCredentialPayload {
  name?: string | null;
  credentials?: Record<string, string> | null;
}

// ── 托管域名 (Domains) ───────────────────────────────────────────────────────

export type DomainSyncStatus = "pending" | "synced";

export interface DomainRead {
  id: number;
  credential_id: number | null;
  domain_name: string;
  zone_id: string | null;
  sync_status: DomainSyncStatus;
  last_sync_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface CreateDomainPayload {
  credential_id: number;
  domain_name: string;
  zone_id?: string | null;
}

export interface UpdateDomainPayload {
  credential_id?: number | null;
  zone_id?: string | null;
}

// ── 解析记录 (Records) ───────────────────────────────────────────────────────

export type DnsRecordType = "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "SRV";

export interface RecordRead {
  id: number;
  domain_id: number;
  record_id: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  priority: number | null;
  proxied: number;
  status: string;
  synced_at: number | null;
}

export interface CreateRecordPayload {
  name: string;
  type: string;
  content: string;
  ttl?: number;
  priority?: number | null;
  proxied?: number;
}

export interface UpdateRecordPayload {
  content?: string | null;
  ttl?: number | null;
  priority?: number | null;
  proxied?: number | null;
}

// ── DDNS 任务 (DDNS Tasks) ───────────────────────────────────────────────────

export type IpVersion = "ipv4" | "ipv6";

export interface DdnsTaskRead {
  id: number;
  record_id: number;
  record_name: string | null;
  server_uuid: string;
  ip_version: string;
  last_ip: string | null;
  is_active: number;
  last_updated: number | null;
  last_error: string | null;
  error_count: number;
  created_at: number;
}

export interface CreateDdnsTaskPayload {
  record_id: number;
  server_uuid: string;
  ip_version?: string;
}

export interface UpdateDdnsTaskPayload {
  server_uuid?: string | null;
  ip_version?: string | null;
  is_active?: number | null;
}

// ── 通用 ──────────────────────────────────────────────────────────────────────

export interface MessageResponse {
  message: string;
}
