export interface Tenant {
  tenantId: string
  code: string
  name: string
  isActive: boolean
  createdAt: string
}

export interface UserListItem {
  userId: string
  userName: string
  displayName: string
  email: string
  isTenantOwner: boolean
  isActive: boolean
  roles: string[]
}

export interface Role {
  roleId: string
  tenantId: string
  code: string
  name: string
  description: string
  isDefault: boolean
  permissions: string[]
}

export interface Permission {
  permissionId: string
  code: string
  name: string
  type: 'Api' | 'Menu'
  description: string
  httpMethod: string
  route: string
}

export interface MenuButton {
  permissionId: string
  code: string
  name: string
}

export interface MenuNode {
  menuId: string
  code: string
  name: string
  path: string
  component: string
  icon: string
  sort: number
  permissionCode: string
  buttons: MenuButton[]
  children: MenuNode[]
}

export interface CreateTenantRequest {
  code: string
  name: string
  adminUserName: string
  adminEmail: string
  adminDisplayName: string
  adminPassword: string
}

export interface UpdateTenantRequest {
  name: string
  isActive: boolean
}

export interface AddTenantUserRequest {
  userId: string
  isTenantOwner: boolean
}

export interface CreateUserRequest {
  userName: string
  email: string
  displayName: string
  password: string
  isActive: boolean
  roleIds: string[]
}

export interface CreateRoleRequest {
  code: string
  name: string
  description: string
  isDefault: boolean
}

export interface UpdateRoleRequest {
  code: string
  name: string
  description: string
  isDefault: boolean
}

export interface PagedResult<T> {
  items: T[]
  pageIndex: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface UserQueryParams {
  keyword?: string
  isActive?: boolean
  pageIndex?: number
  pageSize?: number
}

export interface RolePermissionSummary {
  permissionIds: string[]
  menuPermissionIds: string[]
  buttonPermissionIds: string[]
  apiPermissionIds: string[]
}

export interface AssignRoleMenusRequest {
  menuPermissionIds: string[]
  buttonPermissionIds: string[]
}

export interface ResetPasswordRequest {
  newPassword: string
}

export interface AuditLogItem {
  auditLogId: string
  entityType: string
  entityId: string
  action: string
  performedBy: string
  performedAt: string
  changes: string
}

export interface AuditLogQuery {
  entityType?: string
  entityId?: string
  action?: string
  startTime?: string
  endTime?: string
  pageIndex?: number
  pageSize?: number
}
