import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

export const http = axios.create({
  baseURL: '/api',
  timeout: 60_000,
})

// ——— Token refresh 逻辑 ———

let refreshPromise: Promise<string | null> | null = null

function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const authStore = useAuthStore()
    const rt = authStore.refreshTokenValue

    if (!rt) {
      return null
    }

    try {
      const response = await axios.post('/api/identity/auth/refresh', { refreshToken: rt })
      const data = response.data

      if (isRecord(data)) {
        const newAccessToken = pickStr(data, 'accessToken', 'token')
        const newRefreshToken = pickStr(data, 'refreshToken')

        if (newAccessToken) {
          authStore.applyAuthResponse({
            userId: pickStr(data, 'userId', 'id') || authStore.profile?.userId || '',
            tenantId: pickStr(data, 'tenantId') || authStore.profile?.tenantId || '',
            tenantCode: pickStr(data, 'tenantCode') || authStore.profile?.tenantCode || '',
            userName: pickStr(data, 'userName', 'username') || authStore.profile?.userName || '',
            displayName: pickStr(data, 'displayName', 'fullName') || authStore.profile?.displayName || '',
            email: pickStr(data, 'email') || authStore.profile?.email || '',
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || rt,
            expiresAt: pickStr(data, 'expiresAt', 'expiration', 'expires') || '',
            roles: toArray(data.roles) || authStore.profile?.roles || [],
            permissions: toArray(data.permissions) || authStore.profile?.permissions || [],
          })
          return newAccessToken
        }
      }

      return null
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ——— 拦截器 ———

http.interceptors.request.use((config) => {
  const authStore = useAuthStore()

  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }

  if (authStore.tenantId) {
    config.headers['X-Tenant-Id'] = authStore.tenantId
  }

  return config
})

http.interceptors.response.use(
  (response) => unwrapApiResponse(response.data),
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true

      const newToken = await tryRefreshToken()

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return http(originalRequest)
      }

      // 刷新也失败，logout
      const authStore = useAuthStore()
      authStore.logout()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    if (!error.config?.suppressError) {
      const message = getErrorMessage(error)
      ElMessage.error(message)
    }

    return Promise.reject(error)
  },
)

// ——— 工具函数 ———

function unwrapApiResponse(payload: unknown) {
  if (!isRecord(payload)) {
    return payload
  }

  if ('data' in payload) {
    return payload.data
  }

  if ('result' in payload) {
    return payload.result
  }

  if ('value' in payload) {
    return payload.value
  }

  return payload
}

function getErrorMessage(error: any) {
  const data = error.response?.data

  if (isRecord(data)) {
    return (
      data.message ??
      data.detail ??
      data.title ??
      data.error ??
      error.message ??
      '请求失败'
    )
  }

  return error.message ?? '请求失败'
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null
}

function pickStr(source: Record<string, any>, ...keys: string[]) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return String(source[key])
    }
  }
  return ''
}

function toArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  return value.map(String)
}
