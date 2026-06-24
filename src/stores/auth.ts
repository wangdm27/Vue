import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '@/types/auth'

const TOKEN_KEY = 'tenant-rbac-token'
const REFRESH_TOKEN_KEY = 'tenant-rbac-refresh-token'
const PROFILE_KEY = 'tenant-rbac-profile'

interface AuthState {
  token: string
  refreshToken: string
  profile: UserProfile | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem(TOKEN_KEY) ?? '',
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) ?? '',
    profile: readProfile(),
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    tenantId: (state) => state.profile?.tenantId ?? '',
    tenantCode: (state) => state.profile?.tenantCode ?? '',
    permissions: (state) => state.profile?.permissions ?? [],
    roles: (state) => state.profile?.roles ?? [],
    userName: (state) => state.profile?.userName ?? '',
    displayName: (state) => state.profile?.displayName ?? '',
    /** 暴露给 http.ts 拦截器使用 */
    refreshTokenValue: (state) => state.refreshToken,
  },

  actions: {
    async login(payload: LoginRequest) {
      const response = await authApi.login(payload)
      this.applyAuthResponse(response)
      return response
    },

    async register(payload: RegisterRequest) {
      const response = await authApi.register(payload)
      this.applyAuthResponse(response)
      return response
    },

    async refreshProfile() {
      if (!this.token) {
        return
      }

      try {
        this.profile = await authApi.me()
        localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile))
      } catch (error) {
        console.error('刷新用户信息失败:', error)
        this.logout()
        throw error
      }
    },

    hasPermission(permissionCode?: string | string[]) {
      if (!permissionCode) {
        return true
      }

      const codes = Array.isArray(permissionCode) ? permissionCode : [permissionCode]
      return codes.every((code) => this.permissions.includes(code))
    },

    logout() {
      this.token = ''
      this.refreshToken = ''
      this.profile = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(PROFILE_KEY)
    },

    applyAuthResponse(response: AuthResponse) {
      this.token = response.accessToken
      this.refreshToken = response.refreshToken
      this.profile = {
        userId: response.userId,
        userName: response.userName,
        displayName: response.displayName,
        email: response.email,
        tenantId: response.tenantId,
        tenantCode: response.tenantCode,
        roles: response.roles,
        permissions: response.permissions,
      }

      localStorage.setItem(TOKEN_KEY, this.token)
      localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken)
      localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile))
    },
  },
})

function readProfile(): UserProfile | null {
  const rawProfile = localStorage.getItem(PROFILE_KEY)

  if (!rawProfile) {
    return null
  }

  try {
    return JSON.parse(rawProfile) as UserProfile
  } catch {
    localStorage.removeItem(PROFILE_KEY)
    return null
  }
}
