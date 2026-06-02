import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

export const http = axios.create({
  baseURL: '/api',
  timeout: 60_000,
})

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
  (error) => {
    if (error.response?.status === 401) {
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
