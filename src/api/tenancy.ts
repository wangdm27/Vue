import { getArrayPayload, isRecord, pickBoolean, pickString, requestFirst } from './compat'
import type { CreateTenantRequest, Tenant } from '@/types/rbac'

export interface AddTenantUserRequest {
  userId: string
  isTenantOwner: boolean
}

export interface UpdateTenantRequest {
  name: string
  isActive: boolean
}

const endpoints = {
  tenants: ['/tenants', '/tenancy/tenants'],
  tenant: (tenantId: string) => [`/tenants/${tenantId}`, `/tenancy/tenants/${tenantId}`],
  current: ['/tenants/current', '/tenancy/tenants/current'],
  currentUsers: ['/tenants/current/users', '/tenancy/tenants/current/users'],
}

export const tenancyApi = {
  async list() {
    const response = await requestFirst<unknown>('get', endpoints.tenants)
    return getArrayPayload<unknown>(response).map(normalizeTenant)
  },

  async create(payload: CreateTenantRequest) {
    const response = await requestFirst<unknown>('post', endpoints.tenants, { data: payload })
    return normalizeTenant(response)
  },

  async current() {
    const response = await requestFirst<unknown>('get', endpoints.current)
    return normalizeTenant(response)
  },

  async update(tenantId: string, payload: UpdateTenantRequest) {
    const response = await requestFirst<unknown>('put', endpoints.tenant(tenantId), { data: payload })
    return normalizeTenant(response)
  },

  addUser(payload: AddTenantUserRequest) {
    return requestFirst<void>('post', endpoints.currentUsers, { data: payload })
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
