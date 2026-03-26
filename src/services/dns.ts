/**
 * DNS 管理 API 服务
 * 封装 /api/v1/dns 接口
 * 提供 TanStack Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  CredentialRead,
  CreateCredentialPayload,
  UpdateCredentialPayload,
  DomainRead,
  CreateDomainPayload,
  UpdateDomainPayload,
  RecordRead,
  CreateRecordPayload,
  UpdateRecordPayload,
  DdnsTaskRead,
  CreateDdnsTaskPayload,
  UpdateDdnsTaskPayload,
  MessageResponse,
} from "@/types/dns";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const dnsKeys = {
  all: ["dns"] as const,
  credentials: () => [...dnsKeys.all, "credentials"] as const,
  credential: (id: number) => [...dnsKeys.all, "credential", id] as const,
  domains: () => [...dnsKeys.all, "domains"] as const,
  domain: (id: number) => [...dnsKeys.all, "domain", id] as const,
  records: (domainId: number) => [...dnsKeys.all, "records", domainId] as const,
  ddnsTasks: () => [...dnsKeys.all, "ddns"] as const,
  ddnsTask: (id: number) => [...dnsKeys.all, "ddns", id] as const,
};

// ── Credential API ────────────────────────────────────────────────────────────

const credentialApi = {
  async list(): Promise<CredentialRead[]> {
    const { status, data } = await api.get("/dns/credentials");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch DNS credentials");
    return data as CredentialRead[];
  },

  async get(id: number): Promise<CredentialRead> {
    const { status, data } = await api.get(`/dns/credentials/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch DNS credential");
    return data as CredentialRead;
  },

  async create(payload: CreateCredentialPayload): Promise<CredentialRead> {
    const { status, data } = await api.post("/dns/credentials", payload);
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create DNS credential");
    return data as CredentialRead;
  },

  async update(id: number, payload: UpdateCredentialPayload): Promise<CredentialRead> {
    const { status, data } = await api.put(`/dns/credentials/${id}`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to update DNS credential");
    return data as CredentialRead;
  },

  async remove(id: number): Promise<MessageResponse> {
    const { status, data } = await api.delete(`/dns/credentials/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete DNS credential");
    return data as MessageResponse;
  },
};

// ── Domain API ────────────────────────────────────────────────────────────────

const domainApi = {
  async list(): Promise<DomainRead[]> {
    const { status, data } = await api.get("/dns/domains");
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch DNS domains");
    return data as DomainRead[];
  },

  async get(id: number): Promise<DomainRead> {
    const { status, data } = await api.get(`/dns/domains/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch DNS domain");
    return data as DomainRead;
  },

  async create(payload: CreateDomainPayload): Promise<DomainRead> {
    const { status, data } = await api.post("/dns/domains", payload);
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create DNS domain");
    return data as DomainRead;
  },

  async update(id: number, payload: UpdateDomainPayload): Promise<DomainRead> {
    const { status, data } = await api.put(`/dns/domains/${id}`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to update DNS domain");
    return data as DomainRead;
  },

  async remove(id: number): Promise<MessageResponse> {
    const { status, data } = await api.delete(`/dns/domains/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete DNS domain");
    return data as MessageResponse;
  },

  async sync(id: number): Promise<MessageResponse> {
    const { status, data } = await api.post(`/dns/domains/${id}/sync`);
    if (status !== 200) throw new Error(data?.detail || "Failed to sync DNS domain");
    return data as MessageResponse;
  },
};

// ── Record API ────────────────────────────────────────────────────────────────

const recordApi = {
  async list(domainId: number): Promise<RecordRead[]> {
    const { status, data } = await api.get(`/dns/domains/${domainId}/records`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch DNS records");
    return data as RecordRead[];
  },

  async create(domainId: number, payload: CreateRecordPayload): Promise<RecordRead> {
    const { status, data } = await api.post(`/dns/domains/${domainId}/records`, payload);
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create DNS record");
    return data as RecordRead;
  },

  async update(recId: number, payload: UpdateRecordPayload): Promise<RecordRead> {
    const { status, data } = await api.put(`/dns/records/${recId}`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to update DNS record");
    return data as RecordRead;
  },

  async remove(recId: number): Promise<MessageResponse> {
    const { status, data } = await api.delete(`/dns/records/${recId}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete DNS record");
    return data as MessageResponse;
  },
};

// ── DDNS Task API ─────────────────────────────────────────────────────────────

const ddnsApi = {
  async list(activeOnly = false): Promise<DdnsTaskRead[]> {
    const { status, data } = await api.get("/dns/ddns", {
      active_only: activeOnly || undefined,
    });
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch DDNS tasks");
    return data as DdnsTaskRead[];
  },

  async get(id: number): Promise<DdnsTaskRead> {
    const { status, data } = await api.get(`/dns/ddns/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to fetch DDNS task");
    return data as DdnsTaskRead;
  },

  async create(payload: CreateDdnsTaskPayload): Promise<DdnsTaskRead> {
    const { status, data } = await api.post("/dns/ddns", payload);
    if (status !== 201 && status !== 200)
      throw new Error(data?.detail || "Failed to create DDNS task");
    return data as DdnsTaskRead;
  },

  async update(id: number, payload: UpdateDdnsTaskPayload): Promise<DdnsTaskRead> {
    const { status, data } = await api.put(`/dns/ddns/${id}`, payload);
    if (status !== 200) throw new Error(data?.detail || "Failed to update DDNS task");
    return data as DdnsTaskRead;
  },

  async remove(id: number): Promise<MessageResponse> {
    const { status, data } = await api.delete(`/dns/ddns/${id}`);
    if (status !== 200) throw new Error(data?.detail || "Failed to delete DDNS task");
    return data as MessageResponse;
  },
};

// ── TanStack Query Hooks — Credential ─────────────────────────────────────────

export function useDnsCredentials() {
  return useQuery({
    queryKey: dnsKeys.credentials(),
    queryFn: credentialApi.list,
  });
}

export function useCreateDnsCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCredentialPayload) => credentialApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dnsKeys.credentials() });
    },
  });
}

export function useUpdateDnsCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCredentialPayload }) =>
      credentialApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dnsKeys.credentials() });
    },
  });
}

export function useDeleteDnsCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => credentialApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dnsKeys.credentials() });
      qc.invalidateQueries({ queryKey: dnsKeys.domains() });
    },
  });
}

// ── TanStack Query Hooks — Domain ─────────────────────────────────────────────

export function useDnsDomains() {
  return useQuery({
    queryKey: dnsKeys.domains(),
    queryFn: domainApi.list,
  });
}

export function useCreateDnsDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDomainPayload) => domainApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dnsKeys.domains() });
    },
  });
}

export function useUpdateDnsDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDomainPayload }) =>
      domainApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dnsKeys.domains() });
    },
  });
}

export function useDeleteDnsDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => domainApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dnsKeys.domains() });
      qc.invalidateQueries({ queryKey: dnsKeys.ddnsTasks() });
    },
  });
}

export function useSyncDnsDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => domainApi.sync(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: dnsKeys.domains() });
      qc.invalidateQueries({ queryKey: dnsKeys.records(id) });
    },
  });
}

// ── TanStack Query Hooks — Record ─────────────────────────────────────────────

export function useDnsRecords(domainId: number | null) {
  return useQuery({
    queryKey: dnsKeys.records(domainId ?? 0),
    queryFn: () => recordApi.list(domainId!),
    enabled: domainId != null && domainId > 0,
  });
}

export function useCreateDnsRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ domainId, payload }: { domainId: number; payload: CreateRecordPayload }) =>
      recordApi.create(domainId, payload),
    onSuccess: (_data, { domainId }) => {
      qc.invalidateQueries({ queryKey: dnsKeys.records(domainId) });
    },
  });
}

export function useUpdateDnsRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recId, payload }: { recId: number; domainId: number; payload: UpdateRecordPayload }) =>
      recordApi.update(recId, payload),
    onSuccess: (_data, { domainId }) => {
      qc.invalidateQueries({ queryKey: dnsKeys.records(domainId) });
    },
  });
}

export function useDeleteDnsRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recId }: { recId: number; domainId: number }) =>
      recordApi.remove(recId),
    onSuccess: (_data, { domainId }) => {
      qc.invalidateQueries({ queryKey: dnsKeys.records(domainId) });
      qc.invalidateQueries({ queryKey: dnsKeys.ddnsTasks() });
    },
  });
}

// ── TanStack Query Hooks — DDNS Task ──────────────────────────────────────────

export function useDdnsTasks(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: dnsKeys.ddnsTasks(),
    queryFn: () => ddnsApi.list(false),
    refetchInterval: options?.refetchInterval,
  });
}

export function useCreateDdnsTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDdnsTaskPayload) => ddnsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dnsKeys.ddnsTasks() });
    },
  });
}

export function useUpdateDdnsTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDdnsTaskPayload }) =>
      ddnsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dnsKeys.ddnsTasks() });
    },
  });
}

export function useDeleteDdnsTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ddnsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dnsKeys.ddnsTasks() });
    },
  });
}
