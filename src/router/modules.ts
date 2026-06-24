import type { RouteRecordRaw } from 'vue-router'
import { Building2, ClipboardList, KeyRound, LayoutDashboard, Menu, ShieldCheck, Users } from 'lucide-vue-next'

export interface AdminRouteMeta {
  title: string
  icon?: unknown
  permission?: string
  hidden?: boolean
}

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { title: '控制台', icon: LayoutDashboard },
  },
  {
    path: '/tenants',
    name: 'Tenants',
    component: () => import('@/views/tenants/TenantListView.vue'),
    meta: { title: '租户管理', icon: Building2, permission: 'tenant.view' },
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/rbac/UserListView.vue'),
    meta: { title: '用户管理', icon: Users, permission: 'user.view' },
  },
  {
    path: '/roles',
    name: 'Roles',
    component: () => import('@/views/rbac/RoleListView.vue'),
    meta: { title: '角色管理', icon: ShieldCheck, permission: 'role.view' },
  },
  {
    path: '/menus',
    name: 'Menus',
    component: () => import('@/views/rbac/MenuListView.vue'),
    meta: { title: '菜单管理', icon: Menu, permission: 'menu.view' },
  },
  {
    path: '/permissions',
    name: 'Permissions',
    component: () => import('@/views/rbac/PermissionListView.vue'),
    meta: { title: '权限字典', icon: KeyRound, permission: 'permission.view' },
  },
  {
    path: '/audit-logs',
    name: 'AuditLogs',
    component: () => import('@/views/rbac/AuditLogView.vue'),
    meta: { title: '审计日志', icon: ClipboardList, permission: 'audit.view' },
  },
]