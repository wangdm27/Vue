import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { adminRoutes } from './modules'

let dynamicRoutesLoaded = false

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { public: true },
  },
  {
    path: '/tenant-register',
    name: 'TenantRegister',
    component: () => import('@/views/tenants/TenantRegisterView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'AdminRoot',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '控制台' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.public) {
    next()
    return
  }

  if (!authStore.isAuthenticated) {
    if (to.path === '/login') {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
    return
  }

  try {
    if (!authStore.profile) {
      await authStore.refreshProfile()
    }

    if (!dynamicRoutesLoaded) {
      loadAccessibleRoutes(authStore.permissions)
      dynamicRoutesLoaded = true
    }

    const permissionCode = to.meta.permission as string | undefined
    if (permissionCode && !authStore.hasPermission(permissionCode)) {
      if (to.path === '/dashboard') {
        next()
      } else {
        next('/dashboard')
      }
      return
    }

    next()
  } catch (error) {
    console.error('路由守卫错误:', error)
    authStore.logout()
    if (to.path === '/login') {
      next()
    } else {
      next('/login')
    }
  }
})

function loadAccessibleRoutes(permissions: string[]) {
  adminRoutes
    .filter((route) => {
      const permissionCode = route.meta?.permission as string | undefined
      return !permissionCode || permissions.includes(permissionCode)
    })
    .forEach((route) => {
      if (!router.hasRoute(route.name as string)) {
        router.addRoute('AdminRoot', route)
      }
    })
}

export default router