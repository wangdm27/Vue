import { http } from './http'
import type { CreateTenantRequest, Tenant } from '@/types/rbac'

export interface AddTenantUserRequest {
  userId: string
  isTenantOwner: boolean
}

export interface UpdateTenantRequest {
  name: string
  isActive: boolean
}

export const tenancyApi = {
  // list() {
  //   return http.post<unknown, Tenant[]>('/tenancy/tenants', { page: 1, pageSize: 20 })
  // },

  create(payload: CreateTenantRequest) {
    return http.post<unknown, Tenant>('/tenancy/tenants', payload)
  },

  current() {
    return http.get<unknown, Tenant>('/tenancy/tenants/current')
  },

  update(tenantId: string, payload: UpdateTenantRequest) {
    return http.put<unknown, Tenant>(`/tenancy/tenants/${tenantId}`, payload)
  },

  addUser(payload: AddTenantUserRequest) {
    return http.post<unknown, void>('/tenancy/tenants/current/users', payload)
  },
}
