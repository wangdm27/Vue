import { request, isRecord, pickBoolean, pickNumber, pickString, toStringArray, getArrayPayload } from './compat'
import type { CreateRoleRequest, CreateUserRequest, MenuButton, MenuNode, Permission, PagedResult, ResetPasswordRequest, Role, RolePermissionSummary, UpdateRoleRequest, UserListItem, UserQueryParams, AssignRoleMenusRequest } from '@/types/rbac'

export interface UpdateUserRequest {
  displayName: string
  email: string
  isActive: boolean
}

export const rbacApi = {
  // ——— 用户 ———

  async users(params?: UserQueryParams): Promise<PagedResult<UserListItem>> {
    const response = await request<unknown>('get', '/identity/users', {
      params: params as Record<string, unknown>,
    })
    return normalizePagedUsers(response)
  },

  async getUser(userId: string) {
    const response = await request<unknown>('get', `/identity/users/${userId}`)
    return normalizeUser(response)
  },

  async createUser(payload: CreateUserRequest) {
    const response = await request<unknown>('post', '/identity/users', { data: payload })
    return normalizeUser(response)
  },

  updateUser(userId: string, payload: UpdateUserRequest) {
    return request<void>('put', `/identity/users/${userId}`, { data: payload })
  },

  deleteUser(userId: string) {
    return request<void>('delete', `/identity/users/${userId}`)
  },

  assignUserRoles(userId: string, roleIds: string[]) {
    return request<void>('put', `/identity/users/${userId}/roles`, { data: { roleIds } })
  },

  resetUserPassword(userId: string, payload: ResetPasswordRequest) {
    return request<void>('put', `/identity/users/${userId}/password`, { data: payload })
  },

  // ——— 角色 ———

  async roles() {
    const response = await request<unknown>('get', '/authorization/roles')
    return getArrayPayload<unknown>(response).map(normalizeRole)
  },

  async createRole(payload: CreateRoleRequest) {
    const response = await request<unknown>('post', '/authorization/roles', { data: payload })
    return normalizeRole(response)
  },

  updateRole(roleId: string, payload: UpdateRoleRequest) {
    return request<void>('put', `/authorization/roles/${roleId}`, { data: payload })
  },

  deleteRole(roleId: string) {
    return request<void>('delete', `/authorization/roles/${roleId}`)
  },

  async getRolePermissions(roleId: string): Promise<RolePermissionSummary> {
    const response = await request<unknown>('get', `/authorization/roles/${roleId}/permissions`)
    return normalizeRolePermissionSummary(response)
  },

  assignRolePermissions(roleId: string, permissionIds: string[]) {
    return request<void>('put', `/authorization/roles/${roleId}/permissions`, { data: { permissionIds } })
  },

  assignRoleMenus(roleId: string, payload: AssignRoleMenusRequest) {
    return request<void>('put', `/authorization/roles/${roleId}/menus`, { data: payload })
  },

  // ——— 权限 ———

  async permissions() {
    const response = await request<unknown>('get', '/authorization/permissions')
    return getArrayPayload<unknown>(response).map(normalizePermission)
  },

  // ——— 菜单 ———

  async currentMenus() {
    const response = await request<unknown>('get', '/authorization/menus/current')
    return getArrayPayload<unknown>(response).map(normalizeMenuNode)
  },
}

// ——— normalize 函数 ———

function normalizePagedUsers(payload: unknown): PagedResult<UserListItem> {
  if (!isRecord(payload)) {
    return { items: [], pageIndex: 1, pageSize: 20, totalCount: 0, totalPages: 0 }
  }

  const items = getArrayPayload<unknown>(payload).map(normalizeUser)
  return {
    items,
    pageIndex: pickNumber(payload, 1, 'pageIndex'),
    pageSize: pickNumber(payload, 20, 'pageSize'),
    totalCount: pickNumber(payload, 0, 'totalCount'),
    totalPages: pickNumber(payload, 0, 'totalPages'),
  }
}

function normalizeUser(payload: unknown): UserListItem {
  const item = asRecord(payload)

  return {
    userId: pickString(item, 'userId', 'id'),
    userName: pickString(item, 'userName', 'username', 'name'),
    displayName: pickString(item, 'displayName', 'fullName'),
    email: pickString(item, 'email'),
    isTenantOwner: pickBoolean(item, false, 'isTenantOwner', 'tenantOwner'),
    isActive: pickBoolean(item, true, 'isActive', 'active', 'enabled'),
    roles: toStringArray(item.roles ?? item.roleCodes),
  }
}

function normalizeRole(payload: unknown): Role {
  const item = asRecord(payload)

  return {
    roleId: pickString(item, 'roleId', 'id'),
    tenantId: pickString(item, 'tenantId'),
    code: pickString(item, 'code', 'roleCode'),
    name: pickString(item, 'name', 'roleName'),
    description: pickString(item, 'description'),
    isDefault: pickBoolean(item, false, 'isDefault', 'default'),
    permissions: toStringArray(item.permissions ?? item.permissionCodes),
  }
}

function normalizePermission(payload: unknown): Permission {
  const item = asRecord(payload)
  const type = pickString(item, 'type', 'permissionType')

  return {
    permissionId: pickString(item, 'permissionId', 'id'),
    code: pickString(item, 'code', 'permissionCode'),
    name: pickString(item, 'name', 'permissionName'),
    type: type.toLowerCase() === 'menu' ? 'Menu' : 'Api',
    description: pickString(item, 'description'),
    httpMethod: pickString(item, 'httpMethod', 'method'),
    route: pickString(item, 'route', 'path', 'url'),
  }
}

function normalizeMenuNode(payload: unknown): MenuNode {
  const item = asRecord(payload)

  return {
    menuId: pickString(item, 'menuId', 'id'),
    code: pickString(item, 'code', 'menuCode'),
    name: pickString(item, 'name', 'menuName', 'title'),
    path: pickString(item, 'path', 'route'),
    component: pickString(item, 'component', 'componentPath'),
    icon: pickString(item, 'icon'),
    sort: pickNumber(item, 0, 'sort', 'order', 'displayOrder'),
    permissionCode: pickString(item, 'permissionCode'),
    buttons: normalizeMenuButtons(item.buttons),
    children: getArrayPayload<unknown>(item.children).map(normalizeMenuNode),
  }
}

function normalizeMenuButtons(payload: unknown): MenuButton[] {
  if (!Array.isArray(payload)) return []
  return payload.map((item) => {
    const rec = isRecord(item) ? item : {}
    return {
      permissionId: pickString(rec, 'permissionId', 'id'),
      code: pickString(rec, 'code'),
      name: pickString(rec, 'name'),
    }
  })
}

function normalizeRolePermissionSummary(payload: unknown): RolePermissionSummary {
  const item = asRecord(payload)

  return {
    permissionIds: toStringArray(item.permissionIds),
    menuPermissionIds: toStringArray(item.menuPermissionIds),
    buttonPermissionIds: toStringArray(item.buttonPermissionIds),
    apiPermissionIds: toStringArray(item.apiPermissionIds),
  }
}

function asRecord(payload: unknown) {
  return isRecord(payload) ? payload : {}
}
