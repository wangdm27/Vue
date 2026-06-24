import { request, isRecord, pickBoolean, pickString, getArrayPayload } from './compat'
import type { AddTenantUserRequest, CreateTenantRequest, Tenant, UpdateTenantRequest } from '@/types/rbac'

export type { AddTenantUserRequest, UpdateTenantRequest }

const endpoints = {
  tenants: '/tenancy/tenants',
  current: '/tenancy/tenants/current',
  currentUsers: '/tenancy/tenants/current/users',
  tenant: (id: string) => `/tenancy/tenants/${id}`,
}

export const tenancyApi = {
  async list() {
    const response = await request<unknown>('get', endpoints.tenants)
    return getArrayPayload<unknown>(response).map(normalizeTenant)
  },

  async create(payload: CreateTenantRequest) {
    const response = await request<unknown>('post', endpoints.tenants, { data: payload })
    return normalizeTenant(response)
  },

  async current() {
    const response = await request<unknown>('get', endpoints.current)
    return normalizeTenant(response)
  },

  async update(tenantId: string, payload: UpdateTenantRequest) {
    const response = await request<unknown>('put', endpoints.tenant(tenantId), { data: payload })
    return normalizeTenant(response)
  },

  addUser(payload: AddTenantUserRequest) {
    return request<void>('post', endpoints.currentUsers, { data: payload })
  },
}

function normalizeTenant(payload: unknown): Tenant {
  const item = isRecord(payload) ? payload : {}

  return {
    tenantId: pickString(item, 'tenantId', 'id'),
    code: pickString(item, 'code', 'tenantCode'),
    name: pickString(item, 'name', 'tenantName'),
    isActive: pickBoolean(item, true, 'isActive', 'active', 'enabled'),
    createdAt: pickString(item, 'createdAt', 'createTime', 'createdOn'),
  }
}
