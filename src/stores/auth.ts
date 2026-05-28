import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '@/types/auth'

const TOKEN_KEY = 'tenant-rbac-token'
const PROFILE_KEY = 'tenant-rbac-profile'

interface AuthState {
  token: string
  profile: UserProfile | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem(TOKEN_KEY) ?? '',
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
      this.profile = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(PROFILE_KEY)
    },

    applyAuthResponse(response: AuthResponse) {
      this.token = response.accessToken
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