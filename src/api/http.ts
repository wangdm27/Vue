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
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    const message = error.response?.data?.message ?? error.message ?? '请求失败'
    ElMessage.error(message)

    return Promise.reject(error)
  },
)