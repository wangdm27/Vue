import { getArrayPayload, isRecord, pickBoolean, pickNumber, pickString, requestFirst, toStringArray } from './compat'
import type { CreateRoleRequest, CreateUserRequest, MenuNode, Permission, Role, UserListItem } from '@/types/rbac'

export interface UpdateUserRequest {
  displayName: string
  email: string
  isActive: boolean
}

const endpoints = {
  users: ['/identity/users'],
  user: (userId: string) => [`/identity/users/${userId}`],
  userRoles: (userId: string) => [`/identity/users/${userId}/roles`],
  roles: ['/authorization/roles'],
  rolePermissions: (roleId: string) => [`/authorization/roles/${roleId}/permissions`],
  permissions: ['/authorization/permissions'],
  currentMenus: ['/authorization/menus/current'],
}

export const rbacApi = {
  async users() {
    const response = await requestFirst<unknown>('get', endpoints.users)
    return getArrayPayload<unknown>(response).map(normalizeUser)
  },

  async createUser(payload: CreateUserRequest) {
    const response = await requestFirst<unknown>('post', endpoints.users, { data: payload })
    return normalizeUser(response)
  },

  updateUser(userId: string, payload: UpdateUserRequest) {
    return requestFirst<unknown>('put', endpoints.user(userId), { data: payload })
  },

  deleteUser(userId: string) {
    return requestFirst<void>('delete', endpoints.user(userId))
  },

  assignUserRoles(userId: string, roleIds: string[]) {
    return requestFirst<void>('put', endpoints.userRoles(userId), { data: { roleIds } })
  },

  async roles() {
    const response = await requestFirst<unknown>('get', endpoints.roles)
    return getArrayPayload<unknown>(response).map(normalizeRole)
  },

  async createRole(payload: CreateRoleRequest) {
    const response = await requestFirst<unknown>('post', endpoints.roles, { data: payload })
    return normalizeRole(response)
  },

  assignRolePermissions(roleId: string, permissionIds: string[]) {
    return requestFirst<void>('put', endpoints.rolePermissions(roleId), { data: { permissionIds } })
  },

  async permissions() {
    const response = await requestFirst<unknown>('get', endpoints.permissions)
    return getArrayPayload<unknown>(response).map(normalizePermission)
  },

  async currentMenus() {
    const response = await requestFirst<unknown>('get', endpoints.currentMenus)
    return getArrayPayload<unknown>(response).map(normalizeMenuNode)
  },
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
    children: getArrayPayload<unknown>(item.children).map(normalizeMenuNode),
  }
}

function asRecord(payload: unknown) {
  return isRecord(payload) ? payload : {}
}
