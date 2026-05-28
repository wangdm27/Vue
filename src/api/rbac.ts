import { http } from './http'
import type { CreateRoleRequest, MenuNode, Permission, Role, UserListItem } from '@/types/rbac'

export interface UpdateUserRequest {
  displayName: string
  email: string
  isActive: boolean
}

export const rbacApi = {
  users() {
    return http.get<unknown, UserListItem[]>('/identity/users')
  },

  updateUser(userId: string, payload: UpdateUserRequest) {
    return http.put<unknown, unknown>(`/identity/users/${userId}`, payload)
  },

  assignUserRoles(userId: string, roleIds: string[]) {
    return http.put<unknown, void>(`/identity/users/${userId}/roles`, { roleIds })
  },

  roles() {
    return http.get<unknown, Role[]>('/authorization/roles')
  },

  createRole(payload: CreateRoleRequest) {
    return http.post<unknown, Role>('/authorization/roles', payload)
  },

  assignRolePermissions(roleId: string, permissionIds: string[]) {
    return http.put<unknown, void>(`/authorization/roles/${roleId}/permissions`, { permissionIds })
  },

  permissions() {
    return http.get<unknown, Permission[]>('/authorization/permissions')
  },

  currentMenus() {
    return http.get<unknown, MenuNode[]>('/authorization/menus/current')
  },
}
