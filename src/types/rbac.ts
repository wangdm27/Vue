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

export interface MenuNode {
  menuId: string
  code: string
  name: string
  path: string
  component: string
  icon: string
  sort: number
  permissionCode: string
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

export interface CreateRoleRequest {
  code: string
  name: string
  description: string
  isDefault: boolean
}
