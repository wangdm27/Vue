import { request, getArrayPayload, isRecord, pickNumber, pickString } from './compat'
import type { AuditLogItem, AuditLogQuery, PagedResult } from '@/types/rbac'

export const auditApi = {
  async list(params?: AuditLogQuery): Promise<PagedResult<AuditLogItem>> {
    const response = await request<unknown>('get', '/audit-logs', {
      params: params as Record<string, unknown>,
    })
    return normalizePagedAuditLogs(response)
  },
}

function normalizePagedAuditLogs(payload: unknown): PagedResult<AuditLogItem> {
  if (!isRecord(payload)) {
    return { items: [], pageIndex: 1, pageSize: 20, totalCount: 0, totalPages: 0 }
  }

  const items = getArrayPayload<unknown>(payload).map(normalizeAuditLog)
  return {
    items,
    pageIndex: pickNumber(payload, 1, 'pageIndex'),
    pageSize: pickNumber(payload, 20, 'pageSize'),
    totalCount: pickNumber(payload, 0, 'totalCount'),
    totalPages: pickNumber(payload, 0, 'totalPages'),
  }
}

function normalizeAuditLog(payload: unknown): AuditLogItem {
  const item = isRecord(payload) ? payload : {}

  return {
    auditLogId: pickString(item, 'auditLogId', 'id'),
    entityType: pickString(item, 'entityType'),
    entityId: pickString(item, 'entityId'),
    action: pickString(item, 'action'),
    performedBy: pickString(item, 'performedBy', 'userId', 'userName'),
    performedAt: pickString(item, 'performedAt', 'createdAt', 'timestamp'),
    changes: pickString(item, 'changes', 'detail'),
  }
}
