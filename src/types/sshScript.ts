/**
 * SSH 快捷脚本库类型定义
 */

export interface SshScript {
  id: number;
  name: string;
  description: string | null;
  content: string;
  language: string;
  top: number;
  created_at: number | null;
  updated_at: number | null;
}

export interface CreateSshScriptPayload {
  name: string;
  description?: string;
  content: string;
  language?: string;
}

export interface UpdateSshScriptPayload {
  name?: string;
  description?: string;
  content?: string;
  language?: string;
  top?: number;
}

export interface BatchUpdateSshScriptTopsResult {
  total: number;
  updated: number;
  failed: number;
  failed_ids: number[];
}
